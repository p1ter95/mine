/*=================================================
UTILITY FUNCTIONS
==================================================*/

function sortByNumber(a, b) { //Sorts array by objects price property
    if (a.price < b.price)
        return -1;
    if (a.price > b.price)
        return 1;
    return 0;
}

function getId(id) { return document.getElementById(id); } //Shortcut for the long name function

function timeStamp(seconds) {
    return parseInt(seconds / 60) + ':' + (parseInt(seconds % 60) < 10 ? '0' : '') + parseInt(seconds % 60);
}

function addPercent(number, percent) {
    return number + (number * percent / 100);
}

function subtractPercent(number, percent) {
    return number - (number * percent / 100);
}

function isNumeric(num) {
    return !isNaN(num)
}

function formatEveryThirdPower(notations) {
    return function (value) {
        var base = 0,
		notationValue = '';
        if (value >= 1000000 && isFinite(value)) {
            value /= 1000;
            while (Math.round(value) >= 1000) {
                value /= 1000;
                base++;
            }
            if (base > notations.length) { return 'Infinity'; } else { notationValue = notations[base]; }
        }
        return (Math.round(value * 1000) / 1000) + notationValue;
    };
}

function rawFormatter(value) { return Math.round(value * 1000) / 1000; }

var numberFormatters =
[
    rawFormatter,
	formatEveryThirdPower([
		'',
		' million',
		' billion',
		' trillion',
		' quadrillion',
		' quintillion',
		' sextillion',
		' septillion',
		' octillion',
		' nonillion',
		' decillion',
        ' undecillion',
        ' duodecillion',
        ' tredecillion',
        ' quattuordecillion',
        ' quindecillion',
        ' sexdecillion',
        ' septendecillion',
        ' octodecillion',
        ' novemdecillion',
        ' vigintillion',
	])
];

function Beautify(value, floats)
{
    var negative = (value < 0);
    var decimal = '';
    if (value < 1000000 && floats > 0) decimal = '.' + (value.toFixed(floats).toString()).split('.')[1];
    value = Math.floor(Math.abs(value));
    var formatter = numberFormatters[Game.options.numbers];
    var output = formatter(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return negative ? '-' + output : output + decimal;
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
    return parseFloat((Math.random() * (max - min + 1) + min).toFixed(2));
}

/*=================================================
THE GAME
==================================================*/

Game = {};

Game.Init = function () {
    Game.name = 'miner';
    Game.tick = 0;
    Game.moneyEarned = 0;
    Game.money = 25;
    Game.moneyIncome = 0;
    Game.incomeMultiplier = 100;
    Game.buildingsAmount = 0;
    Game.upgradesUnlocked = 0;
    Game.achievementsUnlocked = 0;
    Game.spentOnUpgrades = 0;
    Game.cumulativeGains = 0;

    Game.tax = 23;
    Game.moneySpentOnTax = 0;

    Game.bonus = false;
    Game.ultraBonus = false;
    Game.bonusTime = 30;
    Game.bonusTimeRemaining = Game.bonusTime;
    Game.bonusMultiplier = 10;
    Game.ultraBonusMultiplier = 1337;
    Game.ultraBonusProbability = 100;
    Game.bonusCount = 0;
    Game.ultraBonusCount = 0;
    Game.bonusMinTime = 60;
    Game.bonusMaxTime = 160;
    Game.bonusInterval = getRandom(this.bonusMinTime, this.bonusMaxTime);

    Game.workers = {};
    Game.workers.type = 'workers';
    Game.workers.amount = 0;
    Game.workers.baseIncome = 50;
    Game.workers.income = 0;
    Game.workers.cumulativeIncome = 0;
    Game.workers.cumulativeGains = 0;
    Game.workers.basePrice = 30000;
    Game.workers.price = 0;
    Game.workers.paymentTime = 300;
    Game.workers.remainingTime = Game.workers.paymentTime;
    Game.workers.efficiency = 0;
    Game.workers.pay = 0;
    Game.workers.salaryPaid = 0;
    Game.workers.maxEfficiency = 100;

    Game.bank = {};
    Game.bank.storedMoney = 0;
    Game.bank.depositedMoney = 0;
    Game.bank.moneyCap = 200;
    Game.bank.difference = 0;
    Game.bank.moneyRate = 2;
    Game.bank.moneyIncreaseTime = 100;
    Game.bank.remainingTime = Game.bank.moneyIncreaseTime;
    Game.bank.loanDebt = 0;
    Game.bank.loanRate = 20;
    Game.bank.loanTime = 60 * 5;
    Game.bank.loanRemainingTime = Game.bank.loanTime;

    Game.lottery = {};
    Game.lottery.numberRange = 30;
    Game.lottery.poolMultiplier = 1;
    Game.lottery.timesWon = 0;
    Game.lottery.timesLost = 0;
    Game.lottery.ratio = 0;
    Game.lottery.balance = 0;
    Game.lottery.ticketsCost = 0;
    Game.lottery.pool = 0;
    Game.lottery.ticket = 0;
    Game.lottery.scores = [0, 0, 0, 0, 0];
    Game.lottery.blocked = false;
    Game.lottery.blockTime = 3;

    Game.firstRun = true;
    Game.startTime = null;

    Game.playingTime = {};
    Game.playingTime.diff = 0;
    Game.playingTime.days = 0;
    Game.playingTime.hours = 0;
    Game.playingTime.minutes = 0;

    Game.options = {};
    Game.options.fps = 24;
    Game.options.numbers = 1;

    Game.allMoneyEarned = 0;
    Game.resetCount = 0;

    Game.fps = Game.options.fps;

    if (this.firstRun) {
        this.firstRun = false;
        this.startTime = new Date();
    }

    //TAXES

    Game.addTax = function (price) {
        return price + (price * Game.tax / 100);
    }

    Game.calculateTax = function (price) {
        return price * Game.tax / 100;
    }

    Game.subtractTax = function (price) {
        return price - (price * Game.tax / 100);
    }

    //WORKERS RELATED

    Game.workers.Pay = function (howmuch) {
        if (howmuch > Game.money) {
            Game.MessageBox('Nie masz wystarczająco pieniędzy', 2);
        }
        else {
            Game.workers.salaryPaid += howmuch;
            Game.Spend(howmuch);
        }
        console.info('You have paid ' + Game.workers.salary);
    }

    //BANK RELATED
    Game.bank.Deposit = function (amount) {
        if (amount > Game.money) {
            Game.MessageBox('Nie masz wystarczajaco pieniedzy', 2);
        }
        else {
            this.storedMoney += amount;
            this.depositedMoney += amount;
            Game.Spend(amount);
            Game.MessageBox('You have deposited <strong class="money-bg">' + Beautify(amount) + '</strong>', 0);
        }
    }

    Game.bank.Withdraw = function (amount) {
        if (amount > this.storedMoney) {
            Game.MessageBox('Nie masz tyle pieniedzy w banku', 2);
        }
        else {
            this.storedMoney -= amount;
            if (amount > this.depositedMoney) {
                this.depositedMoney = 0;
            }
            else {
                this.depositedMoney -= amount;
            }
            Game.GetRawMoney(amount);
            Game.MessageBox('You have withdrawn <strong class="money-bg">' + Beautify(amount) + '</strong>', 0);
        }
    }

    Game.bank.borrow = function (amount) {
        if (Game.money <= 0) {
            Game.MessageBox('Nie możesz pożyczać nie mając pieniędzy', 2);
        }
        else if (amount > Game.rawIncome * 60 * 60 * 6) {
            Game.MessageBox('Nie możesz tyle pożyczyć jednorazowo', 2);
        }
        else if (Game.bank.loanDebt > Game.rawIncome * 60 * 60 * 30) {
            Game.MessageBox('Nie możesz pożyczyć więcej', 2);
        }
        else {
            Game.GetRawMoney(amount);
            Game.bank.loanDebt += addPercent(amount, Game.bank.loanRate);
            Game.MessageBox('You have borrowed <strong class="money-bg">' + Beautify(amount) + '</strong>', 0);
        }
    }

    Game.bank.payback = function (amount) {
        if (amount > Game.bank.loanDebt) {
            Game.MessageBox('You can\'t payback more than your debt amount', 2);
        }
        else if (Game.bank.loanDebt <= 0) {
            Game.MessageBox('You have no loan debt', 2);
        }
        else if (amount > Game.money) {
            Game.bank.loanDebt -= Game.money;
            Game.MessageBox('You have payed <strong class="money-bg">' + Beautify(Game.money) + '</strong> back', 0);
            Game.money = 0;
        }
        else {
            Game.money -= amount;
            Game.bank.loanDebt -= amount;
            Game.MessageBox('You have payed <strong class="money-bg">' + Beautify(amount) + '</strong> back', 0);
        }
    }

    //MONEY

    Game.GetMoney = function (howmuch) {
        Game.money += howmuch;
        Game.moneyEarned += howmuch;
        Game.allMoneyEarned += howmuch;
        Game.moneySpentOnTax += ((100 + Game.tax) * howmuch / 100) - howmuch;
    }

    Game.GetRawMoney = function (howmuch) {
        Game.money += howmuch;
    }

    Game.Spend = function (howmuch) {
        Game.money -= howmuch;
        Game.moneySpentOnTax += (Game.tax / (Game.addTax(howmuch) == 0 ? 1 : Game.addTax(howmuch))) * howmuch;
    }

    Game.buy = function (what, amount) {
        var x = amount === undefined ? 1 : amount;
        for (var i = 0; i < x; i++) {
            if (what.price > Game.money) {
                Game.MessageBox('Nie masz wystarczająco pieniędzy', 2);
            }
            else {
                Game.Spend(what.price);
                what.amount++;
            }
        }
    }

    Game.sell = function (what) {
        var percent = 0;
        switch (what.type) {
            case 'building': percent = Game.BuildingsPercents(); break;
            case 'workers': percent = Game.WorkersPercents(); break;
        }
        if (what.amount <= 0) {
            Game.MessageBox('Nie można już więcej sprzedać', 2);
        }
        else {
            what.amount--;
            Game.GetRawMoney(subtractPercent(what.price * 0.69, percent));
        }
    }

    Game.buyMax = function (what, _return) {
        var percent = 0;
        switch (what.type) {
            case 'building': percent = Game.BuildingsPercents(); break;
            case 'workers': percent = Game.WorkersPercents(); break;
        }
        var bought = what.amount;
        var afford = 0;
        var price = 0;
        while (price < Game.money) {
            afford++;
            price = Game.addTax(subtractPercent(what.basePrice * (Math.pow(1.15, bought + afford) - Math.pow(1.15, bought)) / 0.15, percent));
        }

        if (price > Game.money && Game.money > 0) {
            --afford;
            price = Game.addTax(subtractPercent(what.basePrice * (Math.pow(1.15, bought + afford) - Math.pow(1.15, bought)) / 0.15, percent));
        }

        if (_return)
            return afford;
        else {
            Game.Spend(price);
            what.amount += afford;
        }

    }

    Game.sellAll = function (what, _return) {
        var percent = 0;
        switch (what.type) {
            case 'building': percent = Game.BuildingsPercents(); break;
            case 'workers': percent = Game.WorkersPercents(); break;
        }
        var money = subtractPercent((what.basePrice * (Math.pow(1.15, what.amount) - 1) / 0.15) * 0.69, percent);
        if (_return)
            return money;
        else {
            Game.GetRawMoney(money);
            what.amount = 0;
        }

    }
    //TOOLTIPS

    Game.Tooltip = {};

    Game.Tooltip.draw = function (text) {
        $("#tooltip").html(text);
        $("#tooltip").show();
    }

    Game.Tooltip.update = function () {
        var tooltip = getId('tooltip');
        tooltip.style.top = Game.mouseY + 10 + 'px';
        tooltip.style.left = Game.mouseX + 35 + 'px';
    }

    Game.Tooltip.hide = function () {
        $("#tooltip").hide();
    }

    //PROMPT

    Game.PromptOption = function (name, click) {
        this.name = name;
        this.click = click;
    }

    Game.Prompt = function (content, options) {
        $('#prompt').show();
        $('#prompt-content').html(content);
        $('#cover').show();
        $('#cover').on('click', function () { Game.ClosePrompt() });

        for(var i=0; i < options.length; i++)
        {
            $('#prompt-content').append('<button id="prompt-option' + (i + 1) + '" class="prompt-option button">' + options[i].name + '</button>');
            $('#prompt-option' + (i + 1)).on('click', options[i].click);
        }

        $('#prompt').css("top", ($(window).innerHeight() - $('#prompt').height()) / 2 + "px");
        $('#prompt').css("left", ($(window).innerWidth() - $('#prompt').width()) / 2 + "px");
    }

    Game.ClosePrompt = function () {
        $('#prompt').hide();
        $('#cover').hide();
        $('.prompt-option').unbind('click');
    }

    Game.SetOptions = function () {
        Game.fps = Game.options.fps;
        $('#option-fps').val(Game.options.fps);
        $('#option-numbers').val(Game.options.numbers);
    }

    //CONTENT

    Game.Building = function (id, name, basePrice, baseIncome) {
        this.id = id;
        this.type = 'building';
        this.name = name;
        this.basePrice = basePrice;
        this.price = this.basePrice;
        this.baseIncome = baseIncome;
        this.income = this.baseIncome;
        this.tier = 0;
        this.amount = 0;
        this.cumulativeIncome = 0;
        this.cumulativeGains = 0;
    }

    Game.Upgrade = function (id, name, desc, basePrice, effect, multiple, hidden) {
        this.id = id;
        this.name = name;
        this.desc = desc;
        this.unlocked = false;
        this.price = basePrice;
        this.basePrice = this.price;
        this.effect = effect;
        this.multiple = multiple ? true : false;
        this.hidden = hidden ? true : false;
        this.used = 0;
        this.disabled = false;
    }

    Game.Achievement = function (id, name, desc) {
        this.id = id;
        this.name = name;
        this.desc = desc;
        this.unlocked = false;
    }

    Game.buildings = [];
    Game.buildings.push(new Game.Building(1, 'Pickaxe', 20, 2));
    Game.buildings.push(new Game.Building(2, 'Digger', 100, 3));
    Game.buildings.push(new Game.Building(3, 'Drilling rig', 500, 5));
    Game.buildings.push(new Game.Building(4, 'Mine', 1000, 10));
    Game.buildings.push(new Game.Building(5, 'Advanced mine', 5000, 20));
    Game.buildings.push(new Game.Building(6, 'High efficiency advanced mine', 50000, 50));
    Game.buildings.push(new Game.Building(7, 'Gold mine', 1000000, 150));

    Game.upgrades = [];
    Game.upgrades.push(new Game.Upgrade(1, 'Simple Enhancer #1', 'Increases the income multiplier by <strong>10%</strong>', 10000,
            function () {
                Game.incomeMultiplier += 10;
            }));

    Game.upgrades.push(new Game.Upgrade(2, 'Simple Enhancer #2', 'Increases the income multiplier by <strong>10%</strong>', 50000,
            function () {
                Game.incomeMultiplier += 10;
            }));

    Game.upgrades.push(new Game.Upgrade(3, 'Simple Enhancer #3', 'Increases the income multiplier by <strong>10%</strong>', 100000,
            function () {
                Game.incomeMultiplier += 10;
            }));

    Game.upgrades.push(new Game.Upgrade(4, 'Booster #1', 'Increases the income multiplier by <strong>20%</strong>', 300000,
            function () {
                Game.incomeMultiplier += 20;
            }));

    Game.upgrades.push(new Game.Upgrade(5, 'Booster #2', 'Increases the income multiplier by <strong>20%</strong>', 500000,
            function () {
                Game.incomeMultiplier += 20;
            }));

    Game.upgrades.push(new Game.Upgrade(6, 'Booster #3', 'Increases the income multiplier by <strong>20%</strong>', 1000000,
            function () {
                Game.incomeMultiplier += 20;
            }));

    Game.upgrades.push(new Game.Upgrade(7, 'Augmented booster #1', 'Increases the income multiplier by <strong>30%</strong>', 5000000,
            function () {
                Game.incomeMultiplier += 30;
            }));

    Game.upgrades.push(new Game.Upgrade(8, 'Augmented booster #2', 'Increases the income multiplier by <strong>30%</strong>', 25000000,
            function () {
                Game.incomeMultiplier += 30;
            }));

    Game.upgrades.push(new Game.Upgrade(9, 'Augmented booster #3', 'Increases the income multiplier by <strong>30%</strong>', 50000000,
            function () {
                Game.incomeMultiplier += 30;
            }));

    Game.upgrades.push(new Game.Upgrade(10, 'Superior booster #1', 'Increases the income multiplier by <strong>40%</strong>', 100000000,
            function () {
                Game.incomeMultiplier += 40;
            }));

    Game.upgrades.push(new Game.Upgrade(11, 'Superior booster #2', 'Increases the income multiplier by <strong>40%</strong>', 150000000,
            function () {
                Game.incomeMultiplier += 40;
            }));

    Game.upgrades.push(new Game.Upgrade(12,'Superior booster #3', 'Increases the income multiplier by <strong>40%</strong>', 200000000,
            function () {
                Game.incomeMultiplier += 40;
            }));

    Game.upgrades.push(new Game.Upgrade(13, 'Advanced booster #1', 'Increases the income multiplier by <strong>45%</strong>', 500000000,
            function () {
                Game.incomeMultiplier += 45;
            }));

    Game.upgrades.push(new Game.Upgrade(14, 'Advanced booster #2', 'Increases the income multiplier by <strong>45%</strong>', 1000000000,
            function () {
                Game.incomeMultiplier += 45;
            }));

    Game.upgrades.push(new Game.Upgrade(15, 'Advanced booster #3', 'Increases the income multiplier by <strong>45%</strong>', 1500000000,
            function () {
                Game.incomeMultiplier += 45;
            }));

    Game.upgrades.push(new Game.Upgrade(16, 'Even more advanced booster #1', 'Increases the income multiplier by <strong>50%</strong>', 2000000000,
            function () {
                Game.incomeMultiplier += 50;
            }));

    Game.upgrades.push(new Game.Upgrade(17, 'Even more advanced booster #2', 'Increases the income multiplier by <strong>50%</strong>', 5000000000,
            function () {
                Game.incomeMultiplier += 50;
            }));

    Game.upgrades.push(new Game.Upgrade(18, 'Even more advanced booster #3', 'Increases the income multiplier by <strong>50%</strong>', 10000000000,
            function () {
                Game.incomeMultiplier += 50;
            }));

    Game.upgrades.push(new Game.Upgrade(19, 'Hellish boost #1', 'Increases the income multiplier by <strong>60%</strong>', 100000000000,
            function () {
                Game.incomeMultiplier += 60;
            }));

    Game.upgrades.push(new Game.Upgrade(20, 'Hellish boost #2', 'Increases the income multiplier by <strong>60%</strong>', 200000000000,
            function () {
                Game.incomeMultiplier += 60;
            }));

    Game.upgrades.push(new Game.Upgrade(21, 'Hellish boost #3', 'Increases the income multiplier by <strong>60%</strong>', 500000000000,
            function () {
                Game.incomeMultiplier += 60;
            }));

    Game.upgrades.push(new Game.Upgrade(22, 'Demolishing enhancer #1', 'Increases the income multiplier by <strong>70%</strong>', 1000000000000,
            function () {
                Game.incomeMultiplier += 70;
            }));

    Game.upgrades.push(new Game.Upgrade(23, 'Demolishing enhancer #2', 'Increases the income multiplier by <strong>70%</strong>', 2000000000000,
            function () {
                Game.incomeMultiplier += 70;
            }));

    Game.upgrades.push(new Game.Upgrade(24, 'Demolishing enhancer #3', 'Increases the income multiplier by <strong>70%</strong>', 5000000000000,
            function () {
                Game.incomeMultiplier += 70;
            }));

    Game.upgrades.push(new Game.Upgrade(25, 'Wrecking enhancer #1', 'Increases the income multiplier by <strong>80%</strong>', 10000000000000,
            function () {
                Game.incomeMultiplier += 80;
            }));

    Game.upgrades.push(new Game.Upgrade(26, 'Wrecking enhancer #2', 'Increases the income multiplier by <strong>80%</strong>', 20000000000000,
            function () {
                Game.incomeMultiplier += 80;
            }));

    Game.upgrades.push(new Game.Upgrade(27, 'Wrecking enhancer #3', 'Increases the income multiplier by <strong>80%</strong>', 30000000000000,
            function () {
                Game.incomeMultiplier += 80;
            }));

    Game.upgrades.push(new Game.Upgrade(28, 'Wrecking enhancer #4', 'Increases the income multiplier by <strong>80%</strong>', 40000000000000,
            function () {
                Game.incomeMultiplier += 80;
            }));

    Game.upgrades.push(new Game.Upgrade(29, 'Wrecking enhancer #5', 'Increases the income multiplier by <strong>80%</strong>', 50000000000000,
            function () {
                Game.incomeMultiplier += 80;
            }));

    Game.upgrades.push(new Game.Upgrade(78, 'Upgrade of annihilation #1', 'Increases the income multiplier by <strong>90%</strong>', 100000000000000,
            function () {
                Game.incomeMultiplier += 90;
            }));

    Game.upgrades.push(new Game.Upgrade(79, 'Upgrade of annihilation #2', 'Increases the income multiplier by <strong>90%</strong>', 200000000000000,
            function () {
                Game.incomeMultiplier += 90;
            }));

    Game.upgrades.push(new Game.Upgrade(80, 'Upgrade of annihilation #3', 'Increases the income multiplier by <strong>90%</strong>', 300000000000000,
            function () {
                Game.incomeMultiplier += 90;
            }));

    Game.upgrades.push(new Game.Upgrade(81, 'Upgrade of annihilation #4', 'Increases the income multiplier by <strong>90%</strong>', 400000000000000,
            function () {
                Game.incomeMultiplier += 90;
            }));

    Game.upgrades.push(new Game.Upgrade(82, 'Upgrade of annihilation #5', 'Increases the income multiplier by <strong>90%</strong>', 500000000000000,
            function () {
                Game.incomeMultiplier += 90;
            }));

    Game.upgrades.push(new Game.Upgrade(30, 'The real hellish upgrade', 'Increases the income multiplier by <strong>666%</strong>', 6666666666666666666,
            function () {
                Game.incomeMultiplier += 666;
            }, false, true));

    Game.upgrades.push(new Game.Upgrade(31, 'Bonus booster', 'Increases the bonus multiplier by <strong>2 times</strong>', 3000000,
            function () {
                Game.bonusMultiplier *= 2;
            }));

    Game.upgrades.push(new Game.Upgrade(32, 'Bonus booster #2', 'Increases the bonus multiplier by <strong>2 times</strong>', 3000000000,
            function () {
                Game.bonusMultiplier *= 2;
            }));

    Game.upgrades.push(new Game.Upgrade(33, 'Bonus booster #3', 'Increases the bonus multiplier by <strong>2 times</strong>', 30000000000,
            function () {
                Game.bonusMultiplier *= 2;
            }));

    Game.upgrades.push(new Game.Upgrade(91, 'Faster than light', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>2 times</strong>', 30000000000000,
            function () {
                Game.ultraBonusMultiplier *= 2;
            }));

    Game.upgrades.push(new Game.Upgrade(97, 'Faster than light #2', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>2 times</strong>', 3000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 2;
            }));
			
    Game.upgrades.push(new Game.Upgrade(98, 'Faster than light #3', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>2 times</strong>', 3000000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 2;
            }));
			
    Game.upgrades.push(new Game.Upgrade(99, 'Faster than light #4', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>2 times</strong>', 30000000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 2;
            }));
		
    Game.upgrades.push(new Game.Upgrade(100, 'Faster than light #5', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>2 times</strong>', 300000000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 2;
            }));

    Game.upgrades.push(new Game.Upgrade(92, 'Give me some chances #1', 'Increases the <strong>ultra</strong> bonus probability by <strong>a little</strong>', 30000000000000,
            function () {
                Game.ultraBonusProbability -= 17;
            }));

    Game.upgrades.push(new Game.Upgrade(93, 'Give me some chances #2', 'Increases the <strong>ultra</strong> bonus probability by <strong>a little</strong>', 300000000000000,
            function () {
                Game.ultraBonusProbability -= 17;
            }));

    Game.upgrades.push(new Game.Upgrade(94, 'Give me some chances #3', 'Increases the <strong>ultra</strong> bonus probability by <strong>a little</strong>', 30000000000000000,
            function () {
                Game.ultraBonusProbability -= 17;
            }));
			
    Game.upgrades.push(new Game.Upgrade(95, 'Give me some chances #4', 'Increases the <strong>ultra</strong> bonus probability by <strong>a little</strong>', 300000000000000000,
            function () {
                Game.ultraBonusProbability -= 17;
            }));
			
    Game.upgrades.push(new Game.Upgrade(96, 'Give me some chances #5', 'Increases the <strong>ultra</strong> bonus probability by <strong>a little</strong>', 30000000000000000000,
            function () {
                Game.ultraBonusProbability -= 17;
            }));

    Game.upgrades.push(new Game.Upgrade(34, 'Final bonus booster', 'Increases the bonus multiplier by <strong>2 times</strong>', 30000000000000,
            function () {
                Game.bonusMultiplier *=2 ;
            }, false, true));

    Game.upgrades.push(new Game.Upgrade(35, 'Longer bonus', 'Increases the bonus duration time by <strong>10 seconds</strong>', 30000000000,
                function () {
                    Game.bonusTime += 10;
                    Game.bonusTimeRemaining += 10;
                }));

    Game.upgrades.push(new Game.Upgrade(36, 'Longer bonus #2', 'Increases the bonus duration time by <strong>10 seconds</strong>', 6000000000000,
                function () {
                    Game.bonusTime += 10;
                    Game.bonusTimeRemaining += 10;
                }));

    Game.upgrades.push(new Game.Upgrade(37, 'Longer bonus #3', 'Increases the bonus duration time by <strong>20 seconds</strong>', 9000000000000,
                function () {
                    Game.bonusTime += 20;
                    Game.bonusTimeRemaining += 20;
                }));

    Game.upgrades.push(new Game.Upgrade(38, 'Longer bonus #4', 'Increases the bonus duration time by <strong>30 seconds</strong>', 120000000000000,
                function () {
                    Game.bonusTime += 30;
                    Game.bonusTimeRemaining += 30;
                }));

    Game.upgrades.push(new Game.Upgrade(39, 'Longer bonus #5', 'Increases the bonus duration time by <strong>50 seconds</strong>', 1500000000000000,
                function () {
                    Game.bonusTime += 50;
                    Game.bonusTimeRemaining += 50;
                }));

    Game.upgrades.push(new Game.Upgrade(40, 'Eternal bonus', 'Increases the bonus duration time by <strong>100 seconds</strong>', 6666666666666666666,
                function () {
                    Game.bonusTime += 100;
                    Game.bonusTimeRemaining += 100;
                }, false, true));

    Game.upgrades.push(new Game.Upgrade(41, 'Money smells good', 'Lowers the time when you get money from the bank by <strong>10 seconds</strong>', 50000000000,
                function () {
                    Game.bank.moneyIncreaseTime -= 10;
                    Game.bank.remainingTime -= 10;
                }));

    Game.upgrades.push(new Game.Upgrade(42, 'Money smells good #2', 'Lowers the time when you get money from the bank by <strong>10 seconds</strong>', 75000000000,
                function () {
                    Game.bank.moneyIncreaseTime -= 10;
                    Game.bank.remainingTime -= 10;
                }));

    Game.upgrades.push(new Game.Upgrade(43, 'Money smells good #3', 'Lowers the time when you get money from the bank by <strong>10 seconds</strong>', 100000000000,
                function () {
                    Game.bank.moneyIncreaseTime -= 10;
                    Game.bank.remainingTime -= 10;
                }));

    Game.upgrades.push(new Game.Upgrade(44, 'More savings', 'Increases the interest rate by <strong>3</strong>', 5000000000,
            function () {
                Game.bank.moneyRate += 3;
            }));

    Game.upgrades.push(new Game.Upgrade(45, 'More savings #2', 'Increases the interest rate by <strong>3</strong>', 7500000000,
            function () {
                Game.bank.moneyRate += 3;
            }));

    Game.upgrades.push(new Game.Upgrade(46, 'More savings #3', 'Increases the interest rate by <strong>3</strong>', 10000000000,
            function () {
                Game.bank.moneyRate += 3;
            }));

    Game.upgrades.push(new Game.Upgrade(87, 'Owing less', 'Reduces the loan rate by <strong>5</strong>', 100000000000,
            function () {
                Game.bank.loanRate -= 5;
            }));

    Game.upgrades.push(new Game.Upgrade(88, 'Owing less #2', 'Reduces the loan rate by <strong>5</strong>', 100000000000000,
            function () {
                Game.bank.loanRate -= 5;
            }));

    Game.upgrades.push(new Game.Upgrade(89, 'Owing less #3', 'Reduces the loan rate by <strong>5</strong>', 100000000000000000,
            function () {
                Game.bank.loanRate -= 5;
            }));

    Game.upgrades.push(new Game.Upgrade(47, 'Push the limit', 'Increases the bank cap by <strong>200%</strong>', 1000000000,
            function () {
                Game.bank.moneyCap += 200;
            }));

    Game.upgrades.push(new Game.Upgrade(77, 'Push the limit #2', 'Increases the bank cap by <strong>200%</strong>', 100000000000,
            function () {
                Game.bank.moneyCap += 200;
            }));

    Game.upgrades.push(new Game.Upgrade(86, 'Push the limit #3', 'Increases the bank cap by <strong>200%</strong>', 100000000000000,
            function () {
                Game.bank.moneyCap += 200;
            }));

    Game.upgrades.push(new Game.Upgrade(48, 'Greater chance', 'Decreases the lottery number range by <strong>5</strong>', 7777777777,
            function () {
                Game.lottery.numberRange -= 5;
            }));

    Game.upgrades.push(new Game.Upgrade(49, 'Greater chance #2', 'Decreases the lottery number range by <strong>5</strong>', 777777777777,
            function () {
                Game.lottery.numberRange -= 5;
            }));

    Game.upgrades.push(new Game.Upgrade(83, 'Greater chance #3', 'Decreases the lottery number range by <strong>2</strong>', 77777777777777,
            function () {
                Game.lottery.numberRange -= 2;
            }));

    Game.upgrades.push(new Game.Upgrade(85, 'Greater chance #4', 'Decreases the lottery number range by <strong>2</strong>', 777777777777777777,
            function () {
                Game.lottery.numberRange -= 2;
            }, false, true));

    Game.upgrades.push(new Game.Upgrade(50, 'Just can\'t wait', 'Lowers the period of bonus occurrences by <strong>10 seconds</strong>', 77777777777,
            function () {
                Game.bonusMinTime -= 10;
                Game.bonusMaxTime -= 10;
            }));

    Game.upgrades.push(new Game.Upgrade(51, 'Just can\'t wait #2', 'Lowers the period of bonus occurrences by <strong>10 seconds</strong>', 777777777777,
            function () {
                Game.bonusMinTime -= 10;
                Game.bonusMaxTime -= 10;
            }));

    Game.upgrades.push(new Game.Upgrade(52, 'Just can\'t wait #3', 'Lowers the period of bonus occurrences by <strong>10 seconds</strong>', 7777777777777,
            function () {
                Game.bonusMinTime -= 10;
                Game.bonusMaxTime -= 10;
            }));

    Game.upgrades.push(new Game.Upgrade(53, 'Just can\'t wait #4', 'Lowers the period of bonus occurrences by <strong>10 seconds</strong>', 77777777777777,
            function () {
                Game.bonusMinTime -= 10;
                Game.bonusMaxTime -= 10;
            }));

    Game.upgrades.push(new Game.Upgrade(54, 'Just can\'t wait #5', 'Lowers the period of bonus occurrences by <strong>10 seconds</strong>', 777777777777777,
            function () {
                Game.bonusMinTime -= 10;
                Game.bonusMaxTime -= 10;
            }));

    Game.upgrades.push(new Game.Upgrade(55, 'Buildings sale #1', 'Lowers the price of all buildings by <strong>10%</strong>', 1000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(56, 'Buildings sale #2', 'Lowers the price of all buildings by <strong>10%</strong>', 10000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(57, 'Buildings sale #3', 'Lowers the price of all buildings by <strong>10%</strong>', 100000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(58, 'Buildings sale #4', 'Lowers the price of all buildings by <strong>10%</strong>', 1000000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(59, 'Buildings sale #5', 'Lowers the price of all buildings by <strong>10%</strong>', 10000000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(60, 'Minimum wage #1', 'Lowers the workers price by <strong>10%</strong>', 1000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(61, 'Minimum wage #2', 'Lowers the workers price by <strong>10%</strong>', 10000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(62, 'Minimum wage #3', 'Lowers the workers price by <strong>10%</strong>', 100000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(63, 'Minimum wage #4', 'Lowers the workers price by <strong>10%</strong>', 1000000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(64, 'Minimum wage #5', 'Lowers the workers price by <strong>10%</strong>', 10000000000000,
           function () {
           }));

    Game.upgrades.push(new Game.Upgrade(65, 'Engineering getting cheap #1', 'Lowers the price of all upgrades by <strong>10%</strong>', 100000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(66, 'Engineering getting cheap #2', 'Lowers the price of all upgrades by <strong>10%</strong>', 1000000000000,
            function () {
            }));

    Game.upgrades.push(new Game.Upgrade(67, 'Engineering getting cheap #3', 'Lowers the price of all upgrades by <strong>10%</strong>', 10000000000000,
           function () {
           }));

    Game.upgrades.push(new Game.Upgrade(68, 'Overhours #1', 'Increases the max workers efficiency by <strong>10%</strong>', 10000000000000,
           function () {
               Game.workers.maxEfficiency += 10;
           }));

    Game.upgrades.push(new Game.Upgrade(69, 'Overhours #2', 'Increases the max workers efficiency by <strong>10%</strong>', 100000000000000,
           function () {
               Game.workers.maxEfficiency += 10;
           }));

    Game.upgrades.push(new Game.Upgrade(70, 'Overhours #3', 'Increases the max workers efficiency by <strong>10%</strong>', 1000000000000000,
           function () {
               Game.workers.maxEfficiency += 10;
           }));

    Game.upgrades.push(new Game.Upgrade(71, 'Mysterious upgrade', 'Dare to click?', 1000000000,
           function () {
               var rand = getRandom(1, 6);
               var money = getRandom(0.15 * Game.moneyEarned, 0.25 * Game.moneyEarned);
               var building = getRandom(0, Game.buildings.length - 1);
               var units = Math.ceil(getRandom(Game.buildings[building].amount * 0.10, Game.buildings[building].amount * 0.30));
               var workersUnits = Math.ceil(getRandom(Game.workers.amount * 0.10, Game.workers.amount * 0.30));

               switch (rand) {
                   case 1:
                       if (money > Game.money) {
                           Game.MessageBox('You just lost <strong class="money-bg">' + Beautify(Game.money) + '</strong>', 2);
                           Game.money = 0;
                       }
                       else {
                           Game.Spend(money);
                           Game.MessageBox('You just lost <strong class="money-bg">' + Beautify(money) + '</strong>', 2);
                       }
                       break;
                   case 2:
                       Game.GetRawMoney(money);
                       Game.MessageBox('You just got <strong class="money-bg">' + Beautify(money) + '</strong>', 0);
                       break;
                       
                   case 3:
                       Game.buildings[building].amount -= units;
                       Game.MessageBox('You just lost <strong>' + units + '</strong> units of <strong>' + Game.buildings[building].name + '</strong>', 2);
                       break;                  
                   case 4:            
                       Game.buildings[building].amount += units;
                       Game.MessageBox('You just got <strong>' + units + '</strong> units of <strong>' + Game.buildings[building].name + '</strong>', 0);
                       break;
                   case 5:
                       Game.workers.amount -= workersUnits;
                       Game.MessageBox('You just lost <strong>' + workersUnits + '</strong> units of <strong>workers</strong>', 2);
                       break;
                   case 6:
                       Game.workers.amount += workersUnits;
                       Game.MessageBox('You just got <strong>' + workersUnits + '</strong> units of <strong>workers</strong>', 0);
                       break;
               }
           
           }, true, true));

    Game.upgrades.push(new Game.Upgrade(72, 'Jackpot', 'Increases lottery pool multiplier by <strong>30%</strong>', 1000000000000,
            function () {
                Game.lottery.poolMultiplier += 0.30;
            }, false, true));

    Game.upgrades.push(new Game.Upgrade(84, 'No limits', 'Makes the lottery block time last <strong>1 second</strong>', 123456787654321,
            function () {
                Game.lottery.blockTime = 1;
            }, false, true));

    Game.upgrades.push(new Game.Upgrade(90, 'Bonus on demand', 'Lets you trigger </strong>bonus</strong> whenever you want', 1000000000,
            function () {
                Game.bonus = true;
                Game.bonusCount++;
                if (getRandom(1, Math.floor(subtractPercent(Game.ultraBonusProbability,10))) == 1) {
                    Game.ultraBonus = true;
                    Game.ultraBonusCount++;
                }
                else {
                    Game.ultraBonus = false;
                }
            }, true, true));

    Game.upgrades.push(new Game.Upgrade(73, 'Riot', 'Lowers the tax rate by <strong>5%</strong>', 666666666666,
            function () {
                Game.tax -= 5;
            }));

    Game.upgrades.push(new Game.Upgrade(74, 'Riot #2', 'Lowers the tax rate by <strong>5%</strong>', 666666666666666,
            function () {
                Game.tax -= 5;
            }));

    Game.upgrades.push(new Game.Upgrade(75, 'Tax Be Gone', 'Freezes tax rate for <strong>5 minutes</strong>', 123456789,
            function () {
                var data = this;
                data.disabled = true;
                var tax = Game.tax;
                Game.tax = 0;
                Game.GetUpgrade('Riot').disabled = true;
                Game.GetUpgrade('Riot #2').disabled = true;
                $(window).on('beforeunload', function () {
                    if (data.disabled) {
                        Game.tax = tax;
                        Game.WriteSave(false, true);
                    }
                });
                setTimeout(function () {
                    Game.tax = tax;
                    data.disabled = false;
                    Game.GetUpgrade('Riot').disabled = false;
                    Game.GetUpgrade('Riot #2').disabled = false;
                }, 5 * 60 * 1000);
            }, true));

    Game.upgrades.push(new Game.Upgrade(76, 'Restoration', 'Lets you get a specified amount of total earned money back', 1234567890,
            function () {
                Game.Prompt('<div>Total money earned: <strong>$' + Beautify(Game.moneyEarned) + '</strong></div><div>How much money of your total earned money you want to restore</div><div id="restoration-error"></div><input type="text" id="restoration-value" style="display: block;width: 100%;"/>', [{
                    name: 'Max', click: function () {
                        getId('restoration-value').value = parseInt(Game.moneyEarned);
                        }
                    }, {
                    name: 'Restore', click: function () {
                        var value = getId('restoration-value').value;
                        var money = parseInt(value);
                        if (value != '') {
                            var money = parseInt(value);
                            if (Game.moneyEarned < money) {
                                getId('restoration-error').innerHTML = "Nie masz tyle pieniędzy";
                            }
                            else {
                                Game.GetRawMoney(money);
                                Game.moneyEarned -= money;
                                //Game.allMoneyEarned -= money;
                                Game.MessageBox('You restored <strong class="money-bg">' + Beautify(money) + '</strong>', 0);
                                Game.ClosePrompt();
                            }
                        }
                    }
                }])
                getId('restoration-value').focus();
            }, true));

    //Game.upgrades.sort(sortByNumber); //SORTOWANIE UPGRADEOW OD NAJNIZSZEJ CENY

    Game.achievements = [];

    Game.achievements.push(new Game.Achievement(1, 'Little business', 'Earn <strong>$' + Beautify(10000) + '</strong>'));
    Game.achievements.push(new Game.Achievement(2, 'Getting serious', 'Earn <strong>$' + Beautify(100000) + '</strong>'));
    Game.achievements.push(new Game.Achievement(3, 'Millionaire', 'Earn <strong>$' + Beautify(1000000) + '</strong>'));
    Game.achievements.push(new Game.Achievement(4, 'Billionaire', 'Earn <strong>$' + Beautify(1000000000) + '</strong>'));
    Game.achievements.push(new Game.Achievement(5, 'Beyond the limits', 'Earn <strong>$' + Beautify(1000000000000) + '</strong>'));
    Game.achievements.push(new Game.Achievement(6, 'Unstoppable', 'Earn <strong>$' + Beautify(1000000000000000) + '</strong>'));
    Game.achievements.push(new Game.Achievement(7, 'Insanity', 'Earn <strong>$' + Beautify(1000000000000000000) + '</strong>'));
    Game.achievements.push(new Game.Achievement(27, 'Halfway', 'Get <strong>50% of the upgrades</strong>'));
    Game.achievements.push(new Game.Achievement(8, 'Enhancer', 'Get <strong>all the upgrades</strong>'));
    Game.achievements.push(new Game.Achievement(9, 'Searching the unknown', 'Unlock a <strong>hidden</strong> upgrade'));
    Game.achievements.push(new Game.Achievement(10, 'Big pockets', 'Have <strong>$' + Beautify(1000000) + '</strong> on hand'));
    Game.achievements.push(new Game.Achievement(11, 'Bigger pockets', 'Have <strong>$' + Beautify(1000000000) + '</strong> on hand'));
    Game.achievements.push(new Game.Achievement(12, 'Saving it up', 'Have <strong>$' + Beautify(1000000000000) + '</strong> on hand'));
    Game.achievements.push(new Game.Achievement(13, 'How\'d I spend all of this money', 'Have <strong>$' + Beautify(1000000000000000) + '</strong> on hand'));
    Game.achievements.push(new Game.Achievement(14, 'Big business', 'Own <strong>' + Game.buildings.length * 100 + '</strong> money generating structures'));
	Game.achievements.push(new Game.Achievement(28, 'Even bigger business', 'Own <strong>' + Game.buildings.length * 200 + '</strong> money generating structures'));
    Game.achievements.push(new Game.Achievement(15, 'Employer', 'Hire <strong>130</strong> workers'));
    Game.achievements.push(new Game.Achievement(16, 'Booster', 'Get bonus <strong>100</strong> times'));
    Game.achievements.push(new Game.Achievement(17, 'Multiplication', 'Get bonus <strong>1000</strong> times'));
	Game.achievements.push(new Game.Achievement(29, 'Finally!', 'Get bonus <strong>ultra bonus</strong> at least <strong>once</strong>'));
    Game.achievements.push(new Game.Achievement(18, 'Addicted', 'Play this game for <strong>a week</strong>'));
    Game.achievements.push(new Game.Achievement(19, 'Money saver', 'Save <strong>$' + Beautify(100000000000) + '</strong> in bank'));
    Game.achievements.push(new Game.Achievement(20, 'The wait was worth', 'Save <strong>$' + Beautify(100000000000000) + '</strong> in bank'));
    Game.achievements.push(new Game.Achievement(21, 'Lucky one', 'Win the lottery <strong>777</strong> times'));
    Game.achievements.push(new Game.Achievement(22, 'Not that bad', 'Score <strong>three numbers 30 times</strong> in the lottery'));
    Game.achievements.push(new Game.Achievement(23, 'Plain lucky', 'Score <strong>four numbers 5 times</strong> in the lottery'));
    Game.achievements.push(new Game.Achievement(24, 'I guess I\'m rich now', 'Score <strong>five numbers</strong> in the lottery'));
    Game.achievements.push(new Game.Achievement(25, 'Sacrifice', '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999) + '</strong> money earned'));
    Game.achievements.push(new Game.Achievement(26, 'Where did it all go?', '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999999) + '</strong> money earned'));

    /*=================================================
    INITIAL DRAWING
    ==================================================*/
    Game.Draw = function () {
        Game.tooltips = [];
        addTooltip('btnReset', 'Resets all your progress but the achievements unlocked');
        addTooltip('option-fps', 'Frames per second');
        addTooltip('option-numbers', 'How numbers are shown');
        addTooltip('buyMaxWorkers', 'It\'ll hire <strong>' + Game.buyMax(Game.workers, true) + '</strong> workers');
        addTooltip('sellAllWorkers', 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.workers, true)) + '</strong> back ');
        /*
        0 - green
        1 - blue
        2 - red
        */
        Game.MessageBox = function (text, type) {
            $('.view').each(function (i) {
                if ($(this).css('display') == 'block') {
                    switch (type) {
                        case 0:
                            $(this).find('.messagebox').css('border-color', '#46A814');
                            $(this).find('.messagebox').css('background', '#96E693 url("res/tick.png") 10px 10px no-repeat');
                            break;
                        case 1: $(this).find('.messagebox').css('border-color', '#0A6491');
                            $(this).find('.messagebox').css('background', '#14A9C7');
                            break;
                        case 2:
                            $(this).find('.messagebox').css('border-color', '#E33A0B');
                            $(this).find('.messagebox').css('background', '#DE8268 url("res/error.png") 10px 10px no-repeat');
                            break;
                    }
                    $(this).find('.messagebox').show()
                    $(this).find('.messageboxtext').html(text);
                }
            });
        }

        function addTooltip(what, text) {
            var i = Game.tooltips.push(text) - 1;
            $('#' + what).attr('data-tooltip', i);

            $('#' + what).on('mouseover', function () {
                Game.Tooltip.draw(Game.tooltips[i]);
            });

            $('#' + what).on('mouseout', function () {
                Game.Tooltip.hide();
            });
        }

        Game.changeTooltip = function (what, text) {
            var id = getId(what).getAttribute('data-tooltip');
            Game.tooltips[id] = text;
        }

        //BUILDINGS

        for (var i = 0; i < Game.buildings.length; i++) {
            $('#mine').append('<div id=buildingItem' + (i + 1) + ' class="buildingItem"/>');
            $('#buildingItem' + (i + 1)).append('<div id=buildingInfo' + (i + 1) + ' class="buildingInfo"/>');
            $('#buildingInfo' + (i + 1)).append('<div id=buildingName' + (i + 1) + ' class="buildingName"/>');
            $('#buildingInfo' + (i + 1)).append('<div id=buildingAmount' + (i + 1) + ' class="buildingAmount"/>');
            $('#buildingInfo' + (i + 1)).append('<div id=buildingTier' + (i + 1) + ' class="buildingTier"/>');
            $('#buildingInfo' + (i + 1)).append('<div id=buildingPrice' + (i + 1) + ' class="buildingPrice money-bg"/>');
            $('#buildingItem' + (i + 1)).append('<div id=sellBuilding' + (i + 1) + ' class="sellBuilding sell-buy">Sell</div>');
            $('#buildingItem' + (i + 1)).append('<div id=sellAllBuildings' + (i + 1) + ' class="sellAllBuildings sell-buy">Sell All</div>');
            $('#buildingItem' + (i + 1)).append('<div id=buyBuilding' + (i + 1) + ' class="buyBuilding sell-buy">Buy</div>');
            $('#buildingItem' + (i + 1)).append('<div id=buyMaxBuildings' + (i + 1) + ' class="buyMaxBuildings sell-buy">Buy Max</div>');
            $('#buildingItem' + (i + 1)).append('<div id=upgrade-building' + (i + 1) + ' class="upgrade-building sell-buy">Upgrade</div>');
            addTooltip('buyMaxBuildings' + (i + 1), 'It\'ll buy <strong>' + Game.buyMax(Game.buildings[i], true) + '</strong> units of ' + Game.buildings[i].name);
            addTooltip('sellAllBuildings' + (i + 1), 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.buildings[i], true)) + '</strong> back ');
        }

        //UPGRADES

        for (var i = 0; i < Game.upgrades.length; i++) {
            $('#upgradesList').append('<div id=upgrade' + (i + 1) + ' class="upgrade active-upgrade"/>');
            addTooltip('upgrade' + (i + 1), '<div>' + Game.upgrades[i].name + (Game.upgrades[i].multiple ? ' <strong>Multiple use (' + Game.upgrades[i].used + ' times used)</strong>' : '') + '</div><div>' + Game.upgrades[i].desc + '</div><div class="money-bg"><strong>' + Beautify(Game.upgrades[i].price) + '<div>');
        }

        //LOTTERY

        $('#lottery').append('<div id="lottery_info">Enter 5 numbers that range from 1 to ' + Game.lottery.numberRange + '</div>');
        $('#lottery').append('<div id="lottery_pool"/>');
        $('#lottery').append('<div id="ticket_price"/>');
        $('#lottery').append('<div id="random_numbers"/>');

        for (var i = 0; i < 5; i++) {
            $('#lottery').append('<input class="num" type="text"/>');
        }

        $('#lottery').append('<button id="playlottery" class="button">Play</button>');

        //STATISTICS
        function createRow(name) {
            $('#statistics_table').append('<tr><td>' + name + '</td><td class="trValue"></td></tr>')
        }

        $('#statistics').append('<table id="statistics_table"/>');

        createRow('Playing time');
        createRow('Money earned during the entire gameplay');
        createRow('Money earned since last reset');
        createRow('Income per minute');
        createRow('Income per hour');
        createRow('Income multiplier');
        createRow('Times you reset');
        createRow('Money spent on upgrades');
        createRow('Times got bonus');
        createRow('Money saved in bank');
        createRow('Bank cap');
        createRow('Money spent on tax');
        createRow('Lottery wins');
        createRow('Lottery losses');
        createRow('Lottery win percentage');
        createRow('Lottery balance');
        createRow('Spent on lottery tickets');

        for (var i = 0; i < Game.lottery.scores.length; i++) {
            createRow('Times scored ' + [i + 1] + (i + 1 == 1 ? ' number' : ' numbers'));
        }

        createRow('Total owned buildings');
        createRow('Salary paid to workers');
        createRow('Cumulative income from workers');
        createRow('Cumulative gains from workers');


        for (var i = 0; i < Game.buildings.length; i++) {
            createRow('Cumulative income from ' + Game.buildings[i].name);
            createRow('Cumulative gains from ' + Game.buildings[i].name);
        }

        $('#statistics_table tr').each(function (i) {
            if (i % 2 == 0) {
                $(this).attr('class', 'tbcolor1');
            } else {
                $(this).attr('class', 'tbcolor2');
            }
        }
        );

        //ACHIEVEMENTS

        for (var i = 0; i < Game.achievements.length; i++) {

            $('#achievements').append('<div id=achievement' + (i + 1) + ' class="achievement" style="display: none;"/>');
            addTooltip('achievement' + (i + 1), '<div>' + Game.achievements[i].name + '</div><div>' + Game.achievements[i].desc + '</div>');

        }

        console.info('Initial drawing completed');
    }

    //LOTTERY

    Game.StartLottery = function (numbers) {
        var randomNumbers = [];
        for (var i = 0; i < 5;) {
            randomNumbers[i] = getRandom(1, Game.lottery.numberRange);
            var repeated = false;
            for (var j = 0; j < i; j++) {
                if (randomNumbers[j] == randomNumbers[i]) {
                    repeated = true;
                    break;
                }
            }
            if (!repeated) i++;
        }
        var won = false;
        var rightnumbers = 0;
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 5; j++) {
                if (randomNumbers[i] == numbers[j]) {
                    won = true;
                    rightnumbers++;
                }
            }
        }

        var prizes = [0.002, 0.003, 10, 40, 100];

        if (won) {
            Game.lottery.timesWon++;
            var prize = Game.subtractTax((Game.lottery.pool) * (prizes[rightnumbers - 1] / 100));
            Game.MessageBox('Wygrałeś: <strong class="money-bg">' + Beautify(prize) + '</strong>. <br/>Trafiłeś ' + rightnumbers + ' liczbe/y', 0);
            Game.GetMoney(prize);
            Game.lottery.balance += prize;
            switch (rightnumbers) {
                case 1: Game.lottery.scores[0]++; break;
                case 2: Game.lottery.scores[1]++; break;
                case 3: Game.lottery.scores[2]++; break;
                case 4: Game.lottery.scores[3]++; break;
                case 5: Game.lottery.scores[4]++; Game.UnlockAchievement('I guess I\'m rich now'); break;
            }
        }
        else {
            Game.lottery.timesLost++;
            Game.MessageBox('Nie wylosowałeś żadnej liczby', 2);
        }
        Game.lottery.blocked = true;
        setTimeout(function () { Game.lottery.blocked = false; }, Game.lottery.blockTime * 1000);

        $('#random_numbers').text(randomNumbers.join(' '));
    }

    Game.CalculateTier = function (cumulativeGains) {
        return Math.round(Math.pow(cumulativeGains, 1 / 10));
    }

    Game.BuildingsPercents = function () {
        var percents = 0;
        percents += Game.Unlocked('Buildings sale #1') ? 10 : 0;
        percents += Game.Unlocked('Buildings sale #2') ? 10 : 0;
        percents += Game.Unlocked('Buildings sale #3') ? 10 : 0;
        percents += Game.Unlocked('Buildings sale #4') ? 10 : 0;
        percents += Game.Unlocked('Buildings sale #5') ? 10 : 0;

        return percents;
    }

    Game.WorkersPercents = function () {
        var percents = 0;
        percents += Game.Unlocked('Minimum wage #1') ? 10 : 0;
        percents += Game.Unlocked('Minimum wage #2') ? 10 : 0;
        percents += Game.Unlocked('Minimum wage #3') ? 10 : 0;
        percents += Game.Unlocked('Minimum wage #4') ? 10 : 0;
        percents += Game.Unlocked('Minimum wage #5') ? 10 : 0;

        return percents;
    }

    Game.UpgradesPercents = function () {
        var percents = 0;
        percents += Game.Unlocked('Engineering getting cheap #1') ? 10 : 0;
        percents += Game.Unlocked('Engineering getting cheap #2') ? 10 : 0;
        percents += Game.Unlocked('Engineering getting cheap #3') ? 10 : 0;

        return percents;
    }

    Game.UnlockAchievement = function (achievementName) {
        for (var i = 0; i < Game.achievements.length; i++) {
            if (Game.achievements[i].name == achievementName && !Game.achievements[i].unlocked) {
                Game.achievements[i].unlocked = true;
                Game.MessageBox("'" + Game.achievements[i].name + "' achievement earned!", 0);
            }
        }
    }

    Game.Unhide = function (upgradeName) {
        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].name == upgradeName && Game.upgrades[i].hidden) {
                Game.upgrades[i].hidden = false;
                Game.MessageBox("'" + Game.upgrades[i].name + "' upgrade revealed!", 0);
            }
        }
    }

    Game.GetUpgrade = function (upgradeName) {
        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].name == upgradeName) {
                return Game.upgrades[i];
            }
        }
    }

    Game.Unlocked = function (name) {
        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].name == name && Game.upgrades[i].unlocked) {
                return true;
            }
        }
        return false;
    }

    Game.Save = { save: '' };
    Game.Save.InsertSave = function (str) {
        save = str;
    }

    Game.Save.GetKey = function (key, def) {
        /*var re = new RegExp("\\|" + key + ":(.*?)\|", "i");
        var m;
        var matches = [];
        while ((m = re.exec(str)) != null) {
            matches.push(m);
        }
        return str.match(re);
        //return save.match(/\|money:(.*?)\|/i)[1];*/
        var split = save.split('|');
        var index = -1;
        for (var i = 0; i < split.length; i++) {
            var value = split[i].split('=');
            if (value[0] == key) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            var value = split[index].split('=');
            return value[1];
        }
        else if(def != undefined){
            return def;
        }
    }

    Game.WriteSave = function (exporting, autosave) {
        var str = '';
        str += 'moneyEarned=' +Game.moneyEarned + '|';
        str += 'money=' + Game.money + '|';
        str += 'incomeMultiplier=' + Game.incomeMultiplier + '|';
        str += 'spentOnUpgrades=' + Game.spentOnUpgrades + '|';
        str += 'workers.amount=' + Game.workers.amount + '|';
        str += 'workers.salaryPaid=' + Game.workers.salaryPaid + '|';
        str += 'workers.maxEfficiency=' + Game.workers.maxEfficiency + '|';
        str += 'workers.cumulativeGains=' + Game.workers.cumulativeGains + '|';
        str += 'bonusMultiplier=' + Game.bonusMultiplier + '|';
        str += 'ultraBonusMultiplier=' + Game.ultraBonusMultiplier + '|';
        str += 'ultraBonusProbability=' + Game.ultraBonusProbability + '|';
        str += 'bonusCount=' + Game.bonusCount + '|';
        str += 'ultraBonusCount=' + Game.ultraBonusCount + '|';
        str += 'bonusTime=' + Game.bonusTime + '|';
        str += 'bonusMinTime=' + Game.bonusMinTime + '|';
        str += 'bonusMaxTime=' + Game.bonusMaxTime + '|';
        str += 'bank.storedMoney=' + Game.bank.storedMoney + '|';
        str += 'bank.moneyRate=' + Game.bank.moneyRate + '|';
        str += 'bank.moneyIncreaseTime=' + Game.bank.moneyIncreaseTime + '|';
        str += 'bank.remainingTime=' + Game.bank.remainingTime + '|';
        str += 'bank.difference=' + Game.bank.difference + '|';
        str += 'bank.depositedMoney=' + Game.bank.depositedMoney + '|';
        str += 'bank.moneyCap=' + Game.bank.moneyCap + '|';
        str += 'bank.loanDebt=' + Game.bank.loanDebt + '|';
        str += 'bank.loanRate=' + Game.bank.loanRate + '|';
        str += 'bank.loanTime=' + Game.bank.loanTime + '|';
        str += 'bank.loanRemainingTime=' + Game.bank.loanRemainingTime + '|';
        str += 'firstRun=' + (Game.firstRun ? '1' : '0') + '|';
        str += 'startTime=' + Game.startTime.toUTCString() + '|';
        str += 'lottery.numberRange=' + Game.lottery.numberRange + '|';
        str += 'lottery.balance=' + Game.lottery.balance + '|';
        str += 'lottery.ticketsCost=' + Game.lottery.ticketsCost + '|';
        str += 'lottery.poolMultiplier=' + Game.lottery.poolMultiplier + '|';
        str += 'lottery.timesWon=' + Game.lottery.timesWon + '|';
        str += 'lottery.timesLost=' + Game.lottery.timesLost + '|';
        str += 'lottery.blockTime=' + Game.lottery.blockTime + '|';
        str += 'tax=' + Game.tax + '|';
        str += 'moneySpentOnTax=' + Game.moneySpentOnTax + '|';
        str += 'options.fps=' + Game.options.fps + '|';
        str += 'options.numbers=' + Game.options.numbers + '|';
        str += 'allMoneyEarned=' + Game.allMoneyEarned + '|';
        str += 'resetCount=' + Game.resetCount + '|';

        for (var i = 0; i < Game.lottery.scores.length; i++) {
            str += 'lottery.scores-' + i + '=' + Game.lottery.scores[i] + '|';
        }

        for (var i = 0; i < Game.buildings.length; i++) {
            str += 'building-' + Game.buildings[i].id + '-amount=' + Game.buildings[i].amount + '|';
            str += 'building-' + Game.buildings[i].id + '-cumulativeGains=' + Game.buildings[i].cumulativeGains + '|';
            str += 'building-' + Game.buildings[i].id + '-tier=' + Game.buildings[i].tier + '|';
        }

        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].unlocked == true) {
                str += 'upgrade-' + Game.upgrades[i].id + '-unlocked=1|';
            }
            else {
                str += 'upgrade-' + Game.upgrades[i].id + '-unlocked=0|';
            }

            str += 'upgrade-' + Game.upgrades[i].id + '-used=' + Game.upgrades[i].used + '|';

            if (Game.upgrades[i].hidden == true) {
                str += 'upgrade-' + Game.upgrades[i].id + '-hidden=1|';
            }
            else {
                str += 'upgrade-' + Game.upgrades[i].id + '-hidden=0|';
            }
        }
        for (var i = 0; i < Game.achievements.length; i++) {
            if (Game.achievements[i].unlocked == true) {
                str += 'ach-' + Game.achievements[i].id + '-unlocked=1|';
            }
            else {
                str += 'ach-' + Game.achievements[i].id + '-unlocked=0|';
            }
        }

        str = btoa(str);
        localStorage.setItem(Game.name, str);
        if (exporting) {
            return str;
        }

        console.info('Game has been saved');
        if (!autosave) Game.MessageBox('Game saved', 0);
    }

    Game.ExportSave = function () {
        //prompt('Copy this save: ', Game.WriteSave(true));
        Game.Prompt('<div>Copy this save</div><textarea id="export-save" style="display: block;width: 250px; height: 300px;">' + Game.WriteSave(true) + '</textarea>', [{ name: 'Close', click: function () { Game.ClosePrompt() }}])
        getId('export-save').focus();
        getId('export-save').select();
        Game.MessageBox('Game exported', 0);
    }

    Game.ImportSave = function () {
        //var save = prompt("Type your save: ")
        Game.Prompt('<div>Type your save</div><input type="text" id="import-save" style="display: block;width: 200px;"/>', [{
            name: 'Import', click: function () {
                var save = getId('import-save').value;
                if (save != '') {
                    Game.LoadSave(save);
                    Game.MessageBox('Game imported', 0);
                }
                Game.ClosePrompt();
            }
        }, { name: 'Close', click: function () { Game.ClosePrompt() } }])
        getId('import-save').focus();
    }

    Game.LoadSave = function (data) {
        var str = '';
        if (data) {
            str = atob(data);
        }
        else if (localStorage.getItem(Game.name)) {
            str = atob(localStorage.getItem(Game.name));
        }
        if (str != '') {
            // var cookie = str[1];
            Game.Save.InsertSave(str);

            Game.moneyEarned = parseFloat(Game.Save.GetKey('moneyEarned'));
            Game.money = parseFloat(Game.Save.GetKey('money'));
            Game.incomeMultiplier = parseFloat(Game.Save.GetKey('incomeMultiplier'));
            Game.spentOnUpgrades = parseFloat(Game.Save.GetKey('spentOnUpgrades'));
            Game.workers.amount = parseFloat(Game.Save.GetKey('workers.amount'));
            Game.workers.salaryPaid = parseFloat(Game.Save.GetKey('workers.salaryPaid'));
            Game.workers.maxEfficiency = parseInt(Game.Save.GetKey('workers.maxEfficiency'));
            Game.workers.cumulativeGains = parseFloat(Game.Save.GetKey('workers.cumulativeGains'));
            Game.bonusMultiplier = parseInt(Game.Save.GetKey('bonusMultiplier'));
            Game.bonusCount = parseInt(Game.Save.GetKey('bonusCount'));
            Game.ultraBonusMultiplier = parseInt(Game.Save.GetKey('ultraBonusMultiplier', Game.ultraBonusMultiplier));
            Game.ultraBonusProbability = parseInt(Game.Save.GetKey('ultraBonusProbability', Game.ultraBonusProbability));
            Game.ultraBonusCount = parseInt(Game.Save.GetKey('ultraBonusCount', Game.ultraBonusCount));
            Game.bonusTime = parseInt(Game.Save.GetKey('bonusTime'));
            Game.bonusTimeRemaining = parseInt(Game.Save.GetKey('bonusTime'));
            Game.bonusMinTime = parseInt(Game.Save.GetKey('bonusMinTime'));
            Game.bonusMaxTime = parseInt(Game.Save.GetKey('bonusMaxTime'));
            Game.bonusInterval = getRandom(Game.bonusMinTime, Game.bonusMaxTime);
            Game.bank.storedMoney = parseFloat(Game.Save.GetKey('bank.storedMoney'));
            Game.bank.moneyRate = parseFloat(Game.Save.GetKey('bank.moneyRate'));
            Game.bank.moneyIncreaseTime = parseInt(Game.Save.GetKey('bank.moneyIncreaseTime'));
            Game.bank.remainingTime = parseInt(Game.Save.GetKey('bank.remainingTime', Game.bank.moneyIncreaseTime));
            Game.bank.difference = parseFloat(Game.Save.GetKey('bank.difference'));
            Game.bank.depositedMoney = parseFloat(Game.Save.GetKey('bank.depositedMoney'));
            Game.bank.moneyCap = parseFloat(Game.Save.GetKey('bank.moneyCap'));
            Game.bank.loanDebt = parseFloat(Game.Save.GetKey('bank.loanDebt', Game.bank.loanDebt));
            Game.bank.loanRate = parseInt(Game.Save.GetKey('bank.loanRate', Game.bank.loanRate));
            Game.bank.loanTime = parseInt(Game.Save.GetKey('bank.loanTime', Game.bank.loanTime));
            Game.bank.loanRemainingTime = parseInt(Game.Save.GetKey('bank.loanRemainingTime', Game.bank.loanRemainingTime));
            Game.firstRun = parseInt(Game.Save.GetKey('firstRun')) == '1' ? true : false;
            Game.startTime = new Date(Game.Save.GetKey('startTime'));
            Game.lottery.numberRange = parseInt(Game.Save.GetKey('lottery.numberRange'));
            Game.lottery.balance = parseFloat(Game.Save.GetKey('lottery.balance'));
            Game.lottery.ticketsCost = parseFloat(Game.Save.GetKey('lottery.ticketsCost'));
            Game.lottery.poolMultiplier = parseInt(Game.Save.GetKey('lottery.poolMultiplier'));
            Game.lottery.timesWon = parseInt(Game.Save.GetKey('lottery.timesWon'));
            Game.lottery.timesLost = parseInt(Game.Save.GetKey('lottery.timesLost'));
            Game.lottery.blockTime = parseInt(Game.Save.GetKey('lottery.blockTime', Game.lottery.blockTime));
            Game.tax = parseInt(Game.Save.GetKey('tax'));
            Game.moneySpentOnTax = parseFloat(Game.Save.GetKey('moneySpentOnTax'));
            Game.options.fps = parseInt(Game.Save.GetKey('options.fps', Game.options.fps));
            Game.options.numbers = parseInt(Game.Save.GetKey('options.numbers', Game.options.numbers));
            Game.allMoneyEarned = parseFloat(Game.Save.GetKey('allMoneyEarned', Game.allMoneyEarned));
            Game.resetCount = parseInt(Game.Save.GetKey('resetCount', Game.resetCount));

            Game.SetOptions();

            for (var i = 0; i < Game.lottery.scores.length; i++) {
                Game.lottery.scores[i] = parseInt(Game.Save.GetKey('lottery.scores-' + i))
            }

            for (var i = 0; i < Game.buildings.length; i++) {
                Game.buildings[i].amount = parseInt(Game.Save.GetKey('building-' +Game.buildings[i].id + '-amount'));
                Game.buildings[i].cumulativeGains = parseFloat(Game.Save.GetKey('building-' + Game.buildings[i].id + '-cumulativeGains'));
                Game.buildings[i].tier = parseFloat(Game.Save.GetKey('building-' + Game.buildings[i].id + '-tier'));
            }

            for (var i = 0; i < Game.upgrades.length; i++) {
                if (Game.Save.GetKey('upgrade-' + Game.upgrades[i].id + '-unlocked') == '1') {
                    Game.upgrades[i].unlocked = true;
                }

                Game.upgrades[i].used = Game.Save.GetKey('upgrade-' + Game.upgrades[i].id + '-used', 0)
                if (Game.Save.GetKey('upgrade-' + Game.upgrades[i].id + '-hidden') == '1')
                    Game.upgrades[i].hidden = true;
                else if(Game.Save.GetKey('upgrade-' + Game.upgrades[i].id + '-hidden') == '0')
                    Game.upgrades[i].hidden = false;
            }
            for (var i = 0; i < Game.achievements.length; i++) {
                if (Game.Save.GetKey('ach-' + Game.achievements[i].id + '-unlocked') == '1') {
                    Game.achievements[i].unlocked = true;
                }
            }

            console.info('Game has been loaded from a save');
        }
    }

    Game.Reset = function () {
        if (Game.moneyEarned >= 999999999999) Game.UnlockAchievement('Sacrifice');
        if (Game.moneyEarned >= 999999999999999) Game.UnlockAchievement('Where did it all go?');

        //Game.startTime = new Date();
        Game.incomeMultiplier = 100 + (Math.pow(Game.allMoneyEarned, 1/6.9));
        Game.moneyEarned = 0;
        Game.money = 25;
        Game.moneyIncome = 0;      
        Game.tax = 23;
        Game.moneySpentOnTax = 0;
        Game.spentOnUpgrades = 0;
        Game.workers.amount = 0;
        Game.workers.salaryPaid = 0;
        Game.workers.cumulativeGains = 0;
        Game.workers.maxEfficiency = 100;
        Game.bonus = false;
        Game.ultraBonus = false;
        Game.bonusMultiplier = 10;
        Game.ultraBonusMultiplier = 1337;
        Game.ultraBonusProbability = 100;
        Game.bonusCount = 0;
        Game.ultraBonusCount = 0;
        Game.bonusTime = 30;
        Game.bonusTimeRemaining = Game.bonusTime;
        Game.bonusMinTime = 60;
        Game.bonusMaxTime = 160;
        Game.bonusInterval = getRandom(Game.bonusMinTime, Game.bonusMaxTime);
        Game.bank.storedMoney = 0;
        Game.bank.moneyRate = 2;
        Game.bank.moneyIncreaseTime = 100;
        Game.bank.remainingTime = Game.bank.moneyIncreaseTime;
        Game.bank.difference = 0;
        Game.bank.depositedMoney = 0;
        Game.bank.moneyCap = 200;
        Game.bank.loanDebt = 0;
        Game.bank.loanRate = 20;
        Game.bank.loanTime = 60 * 5;
        Game.bank.loanRemainingTime = Game.bank.loanTime;
        Game.lottery.numberRange = 30;
        Game.lottery.poolMultiplier = 1;
        Game.lottery.timesWon = 0;
        Game.lottery.timesLost = 0;
        Game.lottery.balance = 0;
        Game.lottery.ticketsCost = 0;
        Game.lottery.blockTime = 3;
        Game.lottery.scores = [0, 0, 0, 0, 0];

        Game.resetCount++;

        Game.lottery.blocked = false;

        for (var i = 0; i < Game.buildings.length; i++) {
            Game.buildings[i].price = Game.buildings[i].basePrice;
            Game.buildings[i].income = Game.buildings[i].baseIncome;
            Game.buildings[i].cumulativeGains = 0;
            Game.buildings[i].amount = 0;
            Game.buildings[i].tier = 0;
        }

        for (var i = 0; i < Game.upgrades.length; i++) {
            Game.upgrades[i].unlocked = false;
            Game.upgrades[i].used = 0;
        }

        /*Game.GetUpgrade('The real hellish upgrade').hidden = true;
        Game.GetUpgrade('Jackpot').hidden = true;
        Game.GetUpgrade('Final bonus booster').hidden = true;
        Game.GetUpgrade('Mysterious upgrade').hidden = true;
        Game.GetUpgrade('Eternal bonus').hidden = true;*/

        /*for (var i = 0; i < Game.achievements.length; i++) {
            Game.achievements[i].unlocked = false;
        } Reset wont clear achievements for now*/

        Game.MessageBox('Game is reset', 0);
    }

    Game.LoadSave();
    Game.Draw();
    Game.HandleEvents();
    Game.Loop();
}

/*=================================================
HANDLING EVENTS
==================================================*/

Game.HandleEvents = function () {
    $(window).on('mousemove', function (event) {
        Game.mouseX = event.pageX;
        Game.mouseY = event.pageY;
    });

    $(window).on('focus', function () {
        Game.fps = Game.options.fps;
    });

    $(window).on('blur', function () {
        Game.fps = 1;
    });

    setInterval(function () {
        if (Game.bank.remainingTime >= 1 && Game.bank.storedMoney > 0) Game.bank.remainingTime--;
        if (Game.bonus && Game.bonusTimeRemaining >= 1) Game.bonusTimeRemaining--;
        if (Math.floor(Game.bank.loanDebt) > 0 && Game.bank.loanRemainingTime >= 1) Game.bank.loanRemainingTime--;
    }, 1000);

    setInterval(function () {
        Game.WriteSave(false, true)
    }, 30 * 1000);

    setInterval(function () {
        if (!Game.bonus) {
            Game.bonus = true;
            Game.bonusCount++;
            Game.bonusInterval = getRandom(Game.bonusMinTime, Game.bonusMaxTime);
            if (getRandom(1, Game.ultraBonusProbability) == 1) {
                Game.ultraBonus = true;
                Game.ultraBonusCount++;
            }
            else {
                Game.ultraBonus = false;
            }
        }
    }, (Game.bonusInterval + Game.bonusTime) * 1000);

    $('.upgrade-building').each(function (i) {
        $(this).on('click', function () {
            Game.buildings[i].tier++;
        });
    }
    );

    $('.buyBuilding').each(function (i) {
        $(this).on('click', function () {
            Game.buy(Game.buildings[i]);
        });
    }
    );

    $('.buyMaxBuildings').each(function (i) {
        $(this).on('click', function () {
            Game.buyMax(Game.buildings[i]);
        });
    }
    );

    $('.sellBuilding').each(function (i) {
        $(this).on('click', function () {
            Game.sell(Game.buildings[i]);
        });
    }
    );

    $('.sellAllBuildings').each(function (i) {
        $(this).on('click', function () {
            Game.sellAll(Game.buildings[i]);
        });
    }
    );

    $('.upgrade').each(function (i) {
        $(this).on('click', function () {
            if (Game.upgrades[i].price > Game.money && !Game.upgrades[i].disabled) {
                Game.MessageBox('Nie masz wystarczająco pieniędzy', 2);
            }
            else if (Game.upgrades[i].multiple && !Game.upgrades[i].disabled) {
                Game.Spend(Game.upgrades[i].price);
                Game.upgrades[i].effect();
                Game.upgrades[i].used++;
                Game.spentOnUpgrades += Game.upgrades[i].price;
            }
            else if (!Game.upgrades[i].unlocked && !Game.upgrades[i].multiple && !Game.upgrades[i].disabled) {
                Game.Spend(Game.upgrades[i].price);
                Game.upgrades[i].effect();
                Game.upgrades[i].unlocked = true;
                Game.spentOnUpgrades += Game.upgrades[i].price;
            }
        });
    }
    );

    $('.closebox').each(function (i) {
        $(this).on('click', function () {
            $(this).parent().fadeOut(350);
        });
    }
    );

    $('#btnSaveGame').on('click', function () { Game.WriteSave(); });
    $('#btnExport').on('click', function () { Game.ExportSave(); });
    $('#btnImport').on('click', function () { Game.ImportSave(); });
    $('#btnReset').on('click', function () { Game.Reset(); });
    $('#btnClearSave').on('click', function () {
        localStorage.setItem(Game.name, '');
        location.reload();
    });

    $('#option-fps').on('change', function () {
        if (isNumeric($(this).val()) && parseInt($(this).val()) > 0 )
        {
            Game.options.fps = parseInt($(this).val());
            Game.fps = Game.options.fps;
        }
    });

    $('#option-numbers').on('change', function () {   
        Game.options.numbers = parseInt($(this).val());
    });

    $('#buyWorker').on('click', function () { Game.buy(Game.workers) });
    $('#buyMaxWorkers').on('click', function () { Game.buyMax(Game.workers) });
    $('#sellWorker').on('click', function () { Game.sell(Game.workers) });
    $('#sellAllWorkers').on('click', function () { Game.sellAll(Game.workers) });
    $('#workersPay').on('click', function () {
        if (getId('workersSalary').value != '')
            Game.workers.Pay(parseInt((getId('workersSalary').value)));
    });

    $('#workersPayMax').on('click', function () {
        if (Game.money >= Game.workers.reqMoney) {
            Game.workers.Pay(Game.workers.reqMoney);
            Game.MessageBox('You have paid <strong class="money-bg">' + Beautify(Game.workers.reqMoney) + '</strong>' , 0);
        }
        else {
            Game.MessageBox('Nie masz wystarczająco pieniędzy', 2);
        }
    });

    $('#deposit').on('click', function () {
        if (getId('bankInput').value != '')
            Game.bank.Deposit(parseInt(getId('bankInput').value));
    });
    $('#withdraw').on('click', function () {
        if (getId('bankInput').value != '')
            Game.bank.Withdraw(parseInt(getId('bankInput').value));
    });
    $('#depositall').on('click', function () { Game.bank.Deposit(Game.money); });
    $('#withdrawall').on('click', function () { Game.bank.Withdraw(Game.bank.storedMoney); });

    $('#borrow').on('click', function () {
        if (getId('loanAmount').value != '' && isNumeric(getId('loanAmount').value))
            Game.bank.borrow(parseInt(getId('loanAmount').value));
    });

    $('#payback').on('click', function () {
        if (getId('paybackAmount').value != '' && isNumeric(getId('paybackAmount').value))
            Game.bank.payback(parseInt(getId('paybackAmount').value));
    });

    $('#playlottery').on('click', function () {
        var numbers = [];
        $('.num').each(function () {
            numbers.push($(this).val());
        });
        var repeated = false;
        var empty = false;

        for (var i = 0; i < numbers.length; i++) {
            for (var j = 0; j < i; j++) {
                if (numbers[j] == numbers[i]) {
                    repeated = true;
                    break;
                }
            }
        }

        $('.num').each(function () {
            if ($(this).val() == '') {
                empty = true;
                return false;
            }
        });
        if (Game.money < Game.lottery.ticket) {
            Game.MessageBox('Nie masz wystarczajaco pieniedzy', 2);
        }
        else if (empty) {
            Game.MessageBox('Nie podałeś numerów', 2);
        }
        else if (repeated) {
            Game.MessageBox('Podane liczby nie mogą się powtarzać', 2);
        }
        else if (Game.lottery.blocked) {
            Game.MessageBox('Musisz odczekać ' + Game.lottery.blockTime + ' sekund', 2);
        }
        else {
            Game.Spend(Game.lottery.ticket);
            Game.lottery.ticketsCost += Game.lottery.ticket;
            Game.StartLottery(numbers);
        }
    });

    console.info('Events initialized');
}

/*=================================================
DRAWING
==================================================*/

Game.UIUpdate = function () {

    Game.Tooltip.update();

    //UPPER BAR - NEED TO FIX THIS
    var money = getId('cash');
    money.innerHTML = "$" + Beautify(Game.money, 0);
    if (Game.money < 0) money.style.color = '#ff3333';
    else
        money.style.color = 'initial';
    var ips = getId('ips');
    ips.innerHTML = "$" + Beautify(Game.moneyIncome, 0) + (Game.bonus ? ' (x' + (Game.ultraBonus ? Game.ultraBonusMultiplier : Game.bonusMultiplier) + ')' : '');
    if (Game.bonus) {
        ips.className = 'bonus-active';
    }
    else {
        ips.className = '';
    }
    getId('tax').innerHTML = 'Tax rate: ' + Game.tax + '%';

    //BUILDINGS
    for (var i = 0; i < Game.buildings.length; i++) {
        if (Game.tick % (Game.fps * 1) == 0) {
            Game.changeTooltip('buyMaxBuildings' + (i + 1), 'It\'ll buy <strong>' + Game.buyMax(Game.buildings[i], true) + '</strong> units of ' + Game.buildings[i].name);
            Game.changeTooltip('sellAllBuildings' + (i + 1), 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.buildings[i], true)) + '</strong> back ');
        }
        getId('buildingName'.concat(i + 1)).innerHTML = Game.buildings[i].name
        getId('buildingAmount'.concat(i + 1)).innerHTML = 'Owned: ' + Game.buildings[i].amount;
        getId('buildingTier'.concat(i + 1)).innerHTML = 'Tier: ' + Game.buildings[i].tier;
        if (Game.buildings[i].tier < Game.CalculateTier(Game.buildings[i].cumulativeGains)) {
            getId('upgrade-building'.concat(i + 1)).style.display = 'block';
        }
        else {
            getId('upgrade-building'.concat(i + 1)).style.display = 'none';
        }
        var price = getId('buildingPrice'.concat(i + 1));
        price.innerHTML = Beautify(Game.buildings[i].price);
        if (Game.money < Game.buildings[i].price) price.style.color = '#ff3333';
        else
            price.style.color = 'initial';
    }

    //UPGRADES

    if (Game.tick % (Game.fps * 1) == 0) {
        getId('upgradesUnlocked').innerHTML = 'Upgrades unlocked: ' + Game.upgradesUnlocked + '/' + Game.upgrades.length + ' (' + Math.round(Game.upgradesUnlocked / Game.upgrades.length * 100) + '%)';
        getId('achievementsUnlocked').innerHTML = 'Achievements unlocked: ' + Game.achievementsUnlocked + '/' + Game.achievements.length + ' (' + Math.round(Game.achievementsUnlocked / Game.achievements.length * 100) + '%)';
    }

    for (var i = 0; i < Game.upgrades.length; i++) {
        if (Game.upgrades[i].price > Game.money && !Game.upgrades[i].unlocked) getId('upgrade'.concat(i + 1)).style.backgroundColor = '#ff4747' //'#FF3333'; //red
        if (Game.upgrades[i].price <= Game.money && !Game.upgrades[i].unlocked) getId('upgrade'.concat(i + 1)).style.backgroundColor = '#ccc';
        if (Game.upgrades[i].unlocked == true) getId('upgrade'.concat(i + 1)).style.backgroundColor = '#50FF50'; //green
        if (Game.upgrades[i].used >= 1) getId('upgrade'.concat(i + 1)).style.backgroundColor = '#50FF50'; //green
        if (Game.upgrades[i].disabled) {
            getId('upgrade'.concat(i + 1)).style.opacity = 0.5;
            getId('upgrade'.concat(i + 1)).className = 'upgrade';
        }
        else {
            getId('upgrade'.concat(i + 1)).style.opacity = 1;
            getId('upgrade'.concat(i + 1)).className = 'upgrade active-upgrade';
        }
        if (Game.upgrades[i].hidden) {
            getId('upgrade'.concat(i + 1)).style.display = 'none';
        }
        else {
            getId('upgrade'.concat(i + 1)).style.display = 'block';
        }
        if (Game.tick % (Game.fps * 1) == 0) Game.changeTooltip('upgrade' + (i + 1), '<div>' + Game.upgrades[i].name + (Game.upgrades[i].multiple ? ' <strong>Multiple use (' + Game.upgrades[i].used + ' times used)</strong>' : '') + '</div><div>' + Game.upgrades[i].desc + '</div><div class="money-bg"><strong>' + Beautify(Game.upgrades[i].price) + '<div>');
    }

    //BANK
    if (Game.tick % (Game.fps * 0.5) == 0) {
        getId('storedMoney').innerHTML = 'Stored money: <strong>$' + Beautify(Game.bank.storedMoney) + '</strong>';
        getId('moneyRate').innerHTML = 'Interest rate: <strong>' + Beautify(Game.bank.moneyRate) + '%</strong>';
        getId('moneyIncrease').innerHTML = 'Time until money increase: <strong class="clock-bg">' + timeStamp(Game.bank.remainingTime) + '</strong>';
        getId('moneyCap').innerHTML = 'Bank cap: <strong>' + Beautify(Game.bank.moneyCap) + '%';

        getId('loanDebt').innerHTML = 'Loan debt: <strong>$' + Beautify(Game.bank.loanDebt);
        getId('loanRate').innerHTML = 'Loan rate: <strong>' + Game.bank.loanRate + '%';
        getId('loanRemainingTime').innerHTML = 'Time until loan payback: <strong class="clock-bg">' + timeStamp(Game.bank.loanRemainingTime) + '</strong>';

        //LOTTERY

        getId('lottery_info').innerHTML = 'Enter <strong>5</strong> numbers that range from <strong>1</strong> to <strong>' + Game.lottery.numberRange + '</strong>';
        getId('lottery_pool').innerHTML = 'Lottery pool: <strong>$' + Beautify(Game.lottery.pool) + '</strong>';
        getId('ticket_price').innerHTML = 'Ticket price: <strong>$' + Beautify(Game.lottery.ticket) + '</strong>';
    }

    //STATISTICS

    var statistics = $('.trValue');

    statistics[0].innerHTML = Game.playingTime.days + ' days, ' + Game.playingTime.hours + ' hours and ' + Game.playingTime.minutes + ' minutes';
    statistics[1].innerHTML = '$' + Beautify(Game.allMoneyEarned);
    statistics[2].innerHTML = '$' + Beautify(Game.moneyEarned);
    statistics[3].innerHTML = '$' + Beautify(Game.moneyIncome * 60);
    statistics[4].innerHTML = '$' + Beautify(Game.moneyIncome * 3600);
    statistics[5].innerHTML = Beautify(Game.incomeMultiplier) + '%';
    statistics[6].innerHTML = Game.resetCount;
    statistics[7].innerHTML = '$' + Beautify(Game.spentOnUpgrades);
    statistics[8].innerHTML = Game.bonusCount;
    statistics[9].innerHTML = '$' + Beautify(Game.bank.difference);
    statistics[10].innerHTML = Beautify(Game.bank.moneyCap) + '%';
    statistics[11].innerHTML = '$' + Beautify(Game.moneySpentOnTax);
    statistics[12].innerHTML = Beautify(Game.lottery.timesWon);
    statistics[13].innerHTML = Beautify(Game.lottery.timesLost);
    statistics[14].innerHTML = Game.lottery.ratio.toFixed(0) + '%';
    statistics[15].innerHTML = '$' + Beautify(Game.lottery.balance);
    statistics[16].innerHTML = '$' + Beautify(Game.lottery.ticketsCost);

    for (var i = 0; i < Game.lottery.scores.length; i++) {
        statistics[17 + i].innerHTML = Game.lottery.scores[i];
    }

    statistics[22].innerHTML = Beautify(Game.buildingsAmount);
    statistics[23].innerHTML = '$' + Beautify(Game.workers.salaryPaid);
    statistics[24].innerHTML = '$' + Beautify(Game.workers.cumulativeIncome);
    statistics[25].innerHTML = '$' + Beautify(Game.workers.cumulativeGains);

    var counter = 26;

    for (var i = 0; i < Game.buildings.length; i++) {
        statistics[counter].innerHTML = '$' + Beautify(Game.buildings[i].cumulativeIncome);
        counter++;
        statistics[counter].innerHTML = '$' + Beautify(Game.buildings[i].cumulativeGains);
        counter++;
    }

    //ACHIEVEMENTS

    if (Game.tick % (Game.fps * 1) == 0) getId('achievementsInfo').innerHTML = Game.achievementsUnlocked > 0 ? 'All achievements earned during gameplay: ' : 'No achievements unlocked so far';

    for (var i = 0; i < Game.achievements.length; i++) {
        if (Game.achievements[i].unlocked) getId('achievement'.concat(i + 1)).style.display = 'block';
        else
            getId('achievement'.concat(i + 1)).style.display = 'none';

        if (Game.tick % (Game.fps * 1) == 0)
        {
            Game.changeTooltip('achievement' + (i + 1), '<div>' + Game.achievements[i].name + '</div><div>' + Game.achievements[i].desc + '</div>');
            Game.achievements[0].desc = 'Earn <strong>$' + Beautify(10000) + '</strong>';
            Game.achievements[1].desc = 'Earn <strong>$' + Beautify(100000) + '</strong>';
            Game.achievements[2].desc = 'Earn <strong>$' + Beautify(1000000) + '</strong>';
            Game.achievements[3].desc = 'Earn <strong>$' + Beautify(1000000000) + '</strong>';
            Game.achievements[4].desc = 'Earn <strong>$' + Beautify(1000000000000) + '</strong>';
            Game.achievements[5].desc = 'Earn <strong>$' + Beautify(1000000000000000) + '</strong>';
            Game.achievements[6].desc = 'Earn <strong>$' + Beautify(1000000000000000000) + '</strong>';
            Game.achievements[10].desc = 'Have <strong>$' + Beautify(1000000) + '</strong> on hand';
            Game.achievements[11].desc = 'Have <strong>$' + Beautify(1000000000) + '</strong> on hand';
            Game.achievements[12].desc = 'Have <strong>$' + Beautify(1000000000000) + '</strong> on hand';
            Game.achievements[13].desc = 'Have <strong>$' + Beautify(1000000000000000) + '</strong> on hand';
            Game.achievements[14].desc = 'Own <strong>' + Game.buildings.length * 100 + '</strong> money generating structures';
            Game.achievements[21].desc = 'Save <strong>$' + Beautify(100000000000) + '</strong> in bank';
            Game.achievements[22].desc = 'Save <strong>$' + Beautify(100000000000000) + '</strong> in bank';
            Game.achievements[27].desc = '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999) + '</strong> money earned';
            Game.achievements[28].desc = '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999999) + '</strong> money earned';
        }

    }

    //WORKERS
    getId('workersAmount').innerHTML = 'Amount: ' + Game.workers.amount;
    getId('workersPrice').innerHTML = 'Price: $' + Beautify(Game.workers.price, 0);
    getId('workersReqMoney').innerHTML = 'Money needed to ' + Game.workers.maxEfficiency + '% efficiency: <strong>$' + Beautify(Game.workers.reqMoney) + '</strong>';
    getId('workersEfficiency').innerHTML = 'Workers efficiency: <strong>' + Game.workers.efficiency + '%</strong>';
    getId('salaryPaid').innerHTML = 'Salary paid: <strong>$' + Beautify(Game.workers.salaryPaid) + '</strong>';

    if (Game.tick % (Game.fps * 1) == 0) {
        Game.changeTooltip('buyMaxWorkers', 'It\'ll hire <strong>' + Game.buyMax(Game.workers, true) + '</strong> workers');
        Game.changeTooltip('sellAllWorkers', 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.workers, true)) + '</strong> back ');
    }

    //Game.options.fps = ('option-fps').value;

    Game.tick++;
}

/*=================================================
LOGIC
==================================================*/

Game.Logic = function () {
    UpdateIncome = function () {
        var accumulatedIncome = 0;

        for (var i = 0; i < Game.buildings.length; i++) {
            accumulatedIncome += (Game.buildings[i].baseIncome * Math.pow(1.035, Game.buildings[i].tier) * (Math.pow(1.05, Game.buildings[i].amount) - 1)) / (0.05);
            Game.buildings[i].cumulativeIncome = Game.subtractTax(((Game.buildings[i].baseIncome * Math.pow(1.035, Game.buildings[i].tier) * (Math.pow(1.05, Game.buildings[i].amount) - 1)) / 0.05) * Game.incomeMultiplier / 100);
        }
        accumulatedIncome += ((Game.workers.baseIncome * Game.workers.efficiency * (Math.pow(1.05, Game.workers.amount) - 1)) / (0.05)) / 100;

        if (Game.bonus) Game.moneyIncome = Game.subtractTax((accumulatedIncome * Game.incomeMultiplier / 100) * (Game.ultraBonus ? Game.ultraBonusMultiplier : Game.bonusMultiplier));
        else
            Game.moneyIncome = Game.subtractTax(accumulatedIncome * Game.incomeMultiplier / 100);

        Game.rawIncome = accumulatedIncome * Game.incomeMultiplier / 100;
    }

    for (var i = 0; i < Game.buildings.length; i++) {
        Game.buildings[i].price = Game.addTax(subtractPercent(Math.pow(1.15, Game.buildings[i].amount) * Game.buildings[i].basePrice, Game.BuildingsPercents()))
        Game.buildings[i].income = Game.subtractTax(Math.pow(1.05, Game.buildings[i].amount) * Game.buildings[i].baseIncome * Math.pow(1.035, Game.buildings[i].tier));
    }

    UpdateIncome();

    //LOTTERY

    Game.lottery.ticket = Game.addTax(Game.rawIncome * 5);
    Game.lottery.ratio = Game.lottery.timesLost + Game.lottery.timesWon == 0 ? 0 : (Game.lottery.timesWon / (Game.lottery.timesLost + Game.lottery.timesWon) * 100);
    Game.lottery.pool = (1 + (Game.bonusMultiplier / 100)) * Game.lottery.poolMultiplier * (Game.rawIncome * 216000) + (Game.moneyEarned / 100) + (Game.bank.difference / 100) + (Game.lottery.balance / 100);

    //UPGRADES PRICING
    for (var i = 0; i < Game.upgrades.length; i++) {
        if (!Game.upgrades[i].multiple) Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice, Game.UpgradesPercents()));
        switch (Game.upgrades[i].name) {
            case 'Restoration': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.20, Game.upgrades[i].used), Game.UpgradesPercents())); break;
            case 'Tax Be Gone': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.20, Game.upgrades[i].used), Game.UpgradesPercents())); break;
            case 'Mysterious upgrade': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.05, Game.upgrades[i].used), Game.UpgradesPercents())); break;
            case 'Bonus on demand': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.04, Game.upgrades[i].used), Game.UpgradesPercents())); break;
        }
    }

    if (Game.bonus && !Game.GetUpgrade('Bonus on demand').hidden) Game.GetUpgrade('Bonus on demand').disabled = true;
    else
        Game.GetUpgrade('Bonus on demand').disabled = false;

    document.title = '$' + Beautify(Game.money) + (Game.bonus ? ' (B)' : '');

    var cumulativeGains = 0;
    for (var i = 0; i < Game.buildings.length; i++) {
        Game.buildings[i].cumulativeGains += Game.buildings[i].cumulativeIncome * (Game.bonus ? (Game.ultraBonus ? Game.ultraBonusMultiplier : Game.bonusMultiplier) : 1) / Game.fps;
        cumulativeGains += Game.buildings[i].cumulativeGains;
        cumulativeGains += Game.workers.cumulativeGains;
    }
    Game.cumulativeGains = cumulativeGains;

    //WORKERS RELATED

    Game.workers.price = Game.addTax(subtractPercent(Math.pow(1.15, Game.workers.amount) * Game.workers.basePrice, Game.WorkersPercents()));
    Game.workers.income = Game.subtractTax(Math.pow(1.05, Game.workers.amount) * Game.workers.baseIncome * Game.workers.efficiency / 100);
    Game.workers.cumulativeIncome = Game.subtractTax(((Game.workers.baseIncome * Game.workers.efficiency * (Math.pow(1.05, Game.workers.amount) - 1)) / 0.05) / 100 * Game.incomeMultiplier / 100);
    Game.workers.cumulativeGains += Game.workers.cumulativeIncome * (Game.bonus ? (Game.ultraBonus ? Game.ultraBonusMultiplier : Game.bonusMultiplier) : 1) / Game.fps;

    Game.GetMoney(Game.moneyIncome / Game.fps);

    //CUMULATIVE AMOUNTS

    var buildingsAmount = 0;
    for (var i = 0; i < Game.buildings.length; i++) {
        buildingsAmount += Game.buildings[i].amount;
    }
    Game.buildingsAmount = buildingsAmount;

    var upgradesUnlocked = 0;
    for (var i = 0; i < Game.upgrades.length; i++) {
        if (Game.upgrades[i].unlocked || Game.upgrades[i].used >= 1)
            upgradesUnlocked++;
    }
    Game.upgradesUnlocked = upgradesUnlocked;

    var achievementsUnlocked = 0;
    for (var i = 0; i < Game.achievements.length; i++) {
        if (Game.achievements[i].unlocked)
            achievementsUnlocked++;
    }
    Game.achievementsUnlocked = achievementsUnlocked;

    //ACHIEVEMENTS UNLOCKING
    if (Game.moneyEarned >= 10000) Game.UnlockAchievement('Little business');
    if (Game.moneyEarned >= 100000) Game.UnlockAchievement('Getting serious');
    if (Game.moneyEarned >= 1000000) Game.UnlockAchievement('Millionaire');
    if (Game.moneyEarned >= 1000000000) Game.UnlockAchievement('Billionaire');
    if (Game.moneyEarned >= 1000000000000) Game.UnlockAchievement('Beyond the limits');
    if (Game.moneyEarned >= 1000000000000000) Game.UnlockAchievement('Unstoppable');
    if (Game.moneyEarned >= 1000000000000000000) Game.UnlockAchievement('Insanity');
    if (Game.money >= 1000000) Game.UnlockAchievement('Big pockets');
    if (Game.money >= 1000000000) Game.UnlockAchievement('Bigger pockets');
    if (Game.money >= 1000000000000) Game.UnlockAchievement('Saving it up');
    if (Game.money >= 1000000000000000) Game.UnlockAchievement('How\'d I spend all of this money');
    if (Game.buildingsAmount >= Game.buildings.length * 100) Game.UnlockAchievement('Big business');
	if (Game.buildingsAmount >= Game.buildings.length * 200) Game.UnlockAchievement('Even bigger business');
    if (Game.workers.amount >= 130) Game.UnlockAchievement('Employer');
    if (Game.bonusCount >= 100) Game.UnlockAchievement('Booster');
    if (Game.bonusCount >= 1000) Game.UnlockAchievement('Multiplication');
	if (Game.ultraBonusCount >= 1) Game.UnlockAchievement('Finally!');
    if (Game.upgradesUnlocked >= Math.floor(Game.upgrades.length/2)) Game.UnlockAchievement('Halfway');
    if (Game.upgradesUnlocked == Game.upgrades.length) Game.UnlockAchievement('Enhancer');
    if (Game.bank.difference >= 100000000000) Game.UnlockAchievement('Money saver');
    if (Game.bank.difference >= 100000000000000) Game.UnlockAchievement('The wait was worth');
    if (Game.lottery.timesWon >= 777) Game.UnlockAchievement('Lucky one');
    if (Game.lottery.scores[2] >= 30) Game.UnlockAchievement('Not that bad');
    if (Game.lottery.scores[3] >= 5) Game.UnlockAchievement('Plain lucky');
    if (Game.playingTime.days >= 7) Game.UnlockAchievement('Addicted');

    if (!Game.GetUpgrade('The real hellish upgrade').hidden
        || !Game.GetUpgrade('Jackpot').hidden 
        || !Game.GetUpgrade('Final bonus booster').hidden
        || !Game.GetUpgrade('Eternal bonus').hidden
        || !Game.GetUpgrade('Mysterious upgrade').hidden
        || !Game.GetUpgrade('No limits').hidden
        || !Game.GetUpgrade('Greater chance #4').hidden
        || !Game.GetUpgrade('Bonus on demand').hidden) Game.UnlockAchievement('Searching the unknown');

    //HIDDEN UPGRADES UNLOCKING
    if (Game.Unlocked('Wrecking enhancer #5') && Game.moneyEarned >= 666666666666666666) Game.Unhide('The real hellish upgrade');
    if (Game.lottery.timesWon >= 777) Game.Unhide('Jackpot');
    if (Game.lottery.timesWon >= 3000) Game.Unhide('Greater chance #4');
    if (Game.lottery.timesWon + Game.lottery.timesLost >= 1000 && Game.playingTime.days >= 5) Game.Unhide('No limits');
    if (Game.bonusCount >= 1000) Game.Unhide('Final bonus booster');
    if (Game.bonusCount >= 1337 && Game.playingTime.days >= 7) Game.Unhide('Bonus on demand');
    if (Game.bonusCount >= 1500 && Game.Unlocked('Final bonus booster') && Game.moneyEarned >= 666666666666666666) Game.Unhide('Eternal bonus');
    if (Game.moneyEarned >= 1000000000000) Game.Unhide('Mysterious upgrade');

    //MEASURING TIME PLAYED
    workersEfficiency = function () {
        Game.workers.pay = Game.workers.cumulativeGains * 0.10;
        var efficiency = Math.round(Game.workers.salaryPaid / Game.workers.pay * 100) > 0 ? Math.round(Game.workers.salaryPaid / Game.workers.pay * 100) : 1;
        if (efficiency > Game.workers.maxEfficiency) {
            Game.workers.efficiency = Game.workers.maxEfficiency;
        }
        else {
            Game.workers.efficiency = efficiency;
        }

        if (efficiency < Game.workers.maxEfficiency) Game.workers.reqMoney = Game.workers.pay * (Game.workers.maxEfficiency - efficiency) / 100;
        else
            Game.workers.reqMoney = 0;
    }

    workersEfficiency();

    measurePlayingTime = function () {
        var now = new Date();

        Game.playingTime.diff = now - Game.startTime;
        Game.playingTime.allDays = Math.floor(Game.playingTime.diff / 1000 / 60 / 60 / 24);
        Game.playingTime.allHours = Math.floor(Game.playingTime.diff / 1000 / 60 / 60);
        Game.playingTime.allMinutes = Math.floor(Game.playingTime.diff / 1000 / 60);
        Game.playingTime.days = Math.floor(Game.playingTime.diff / 1000 / 60 / 60 / 24);
        Game.playingTime.diff -= Game.playingTime.days * 1000 * 60 * 60 * 24;

        Game.playingTime.hours = Math.floor(Game.playingTime.diff / 1000 / 60 / 60);
        Game.playingTime.diff -= Game.playingTime.hours * 1000 * 60 * 60;

        Game.playingTime.minutes = Math.floor(Game.playingTime.diff / 1000 / 60);
        Game.playingTime.diff -= Game.playingTime.minutes * 1000 * 60;
    }

    measurePlayingTime();

    //BONUS

    if (Game.bonus) {
        if (Game.bonusTimeRemaining <= 0) {
            Game.bonusTimeRemaining = Game.bonusTime;
            Game.bonus = false;
        }
    }

    //BANK

    if (Game.bank.remainingTime <= 0) {
        Game.bank.remainingTime = Game.bank.moneyIncreaseTime;
        if (Game.bank.storedMoney > 0) {
            var quota = Game.bank.depositedMoney * Game.bank.moneyCap / 100;
            var growth = Game.bank.storedMoney * Game.bank.moneyRate / 100;
            if (Game.bank.storedMoney < quota && Game.bank.difference < (Game.bank.moneyCap / 1000) * Game.moneyEarned) {
                Game.bank.storedMoney += growth;
                Game.moneyEarned += growth;
                Game.allMoneyEarned += growth;
                Game.bank.difference += growth;
            }
        }
    }

    if (Game.bank.loanRemainingTime <= 0) {
        var money = Game.bank.loanDebt * 0.25;
        Game.bank.payback(money);
        Game.bank.loanRemainingTime = Game.bank.loanTime;
    }

}

/*=================================================
THE MAIN LOOP
==================================================*/

Game.Loop = function () {
    Game.Logic();
    Game.UIUpdate();

    setTimeout(Game.Loop, 1000 / Game.fps);
}

/*=================================================
LAUNCHING
==================================================*/

onload = function () {
    Game.Init();
    console.info('Game has started');
}