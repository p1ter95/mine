﻿/*=================================================
UTILITY FUNCTIONS
==================================================*/

function preload(images) {
	var _images = [];
	for (i = 0; i < images.length; i++) {
		_images[i] = new Image();
		_images[i].src = images[i];
	}
	console.info('Images preloaded');
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
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
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
	Game.buildingsPriceReduction = 0;
	Game.workersPriceReduction = 0;
	Game.upgradesPriceReduction = 0;
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
    Game.ultraBonusProbability = 3;
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
	Game.workers.getPrice = function(amount) {
		return Game.addTax(subtractPercent(Math.pow(1.15, amount !== undefined ? amount : Game.workers.amount) * Game.workers.basePrice, Game.workersPriceReduction));
	}

    Game.bank = {};
    Game.bank.storedMoney = 0;
    Game.bank.depositedMoney = 0;
    Game.bank.moneyCap = 200;
    Game.bank.difference = 0;
    Game.bank.moneyRate = 2;
    Game.bank.moneyIncreaseTime = 100;
    Game.bank.remainingTime = Game.bank.moneyIncreaseTime;
	Game.bank.borrowedMoney = 0;
    Game.bank.loanDebt = 0;
    Game.bank.loanRate = 20;
    Game.bank.loanTime = 60 * 3;
    Game.bank.loanRemainingTime = Game.bank.loanTime;

    Game.lottery = {};
    Game.lottery.numberRange = 30;
    Game.lottery.poolMultiplier = 1;
	Game.lottery.timesPlayed = 0;
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
	
	Game.stockmarket = {};
	Game.stockmarket.balance = 0;
	Game.stockmarket.updateTime = 20;
	Game.stockmarket.remainingTime = Game.stockmarket.updateTime;
	
    Game.firstRun = true;
    Game.startTime = null;

    Game.playingTime = {};
    Game.playingTime.diff = 0;
    Game.playingTime.days = 0;
    Game.playingTime.hours = 0;
    Game.playingTime.minutes = 0;
	
    Game.options = {};
    Game.options.autoSave = true;
    Game.options.autoSaveTime = 30;
    Game.options.fps = 24;
    Game.options.numbers = 1;
	Game.options.lotteryRegularTicket = true;
	Game.options.lotteryCustomTicketPrice = 0;
	Game.options.lotteryNumbers = [0, 0, 0, 0, 0];

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
            Game.MessageBox('You don\'t have enough money', 2);
        }
        else if (howmuch > 0) {
            Game.workers.salaryPaid += howmuch;
            Game.Spend(howmuch);
			Game.MessageBox('You have paid <strong class="money-bg">' + Beautify(howmuch) + '</strong>', 0)
        }
    }

    //BANK RELATED

    Game.bank.Deposit = function (amount) {
        if (amount > Game.money) {
            Game.MessageBox('You don\'t have enough money', 2);
        }
        else if(amount > 0) {
            this.storedMoney += amount;
            this.depositedMoney += amount;
            Game.Spend(amount);
            Game.MessageBox('You have deposited <strong class="money-bg">' + Beautify(amount) + '</strong>', 0);
        }
    }

    Game.bank.Withdraw = function (amount) {
        if (amount > this.storedMoney) {
            Game.MessageBox('You don\'t have enough money', 2);
        }
        else if(amount > 0) {
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
		else if (Game.bank.loanDebt > 0) {
            Game.MessageBox('Nie możesz pożyczyć mając dług', 2);
        }
        else if (amount > Game.bank.maxLoan) {
            Game.MessageBox('Nie możesz tyle pożyczyć jednorazowo', 2);
        }
        else if(amount > 0){
            Game.GetRawMoney(amount);
            Game.bank.loanDebt += Math.floor(addPercent(amount, Game.bank.loanRate));
			Game.bank.borrowedMoney += Math.floor(addPercent(amount, Game.bank.loanRate));
            Game.MessageBox('You have borrowed <strong class="money-bg">' + Beautify(amount) + '</strong>', 0);
			Game.bank.loanRemainingTime = Game.bank.loanTime;
        }
    }

    Game.bank.payback = function (amount) {     
        if (Game.bank.loanDebt <= 0) {
            Game.MessageBox('You have no loan debt', 2);
        }
		else if (amount > Game.bank.loanDebt) {
			var debt = Game.bank.loanDebt;
			Game.money -= debt;
			Game.bank.loanDebt = 0;
			Game.bank.borrowedMoney = 0;
            //Game.MessageBox('You can\'t payback more than your debt amount', 2);
			Game.MessageBox('You have paid <strong class="money-bg">' + Beautify(debt) + '</strong> back', 0);
        }
        /*else if (amount > Game.money) {
            Game.bank.loanDebt -= Game.money;
            Game.MessageBox('You have paid <strong class="money-bg">' + Beautify(Game.money) + '</strong> back', 0);
            Game.money = 0;
        }*/
        else {
            Game.money -= amount;
            Game.bank.loanDebt -= amount;
			if(Game.bank.loanDebt <= 0) Game.bank.borrowedMoney = 0;
            Game.MessageBox('You have paid <strong class="money-bg">' + Beautify(amount) + '</strong> back', 0);
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
	
	//BUYING AND SELLING STUFF

    Game.buy = function (what, amount) {
        amount = amount !== undefined ? amount : 1;
		if(Game.shiftKey) amount = 10;
		else if(Game.ctrlKey) amount = 25;
		if(amount > 1) {
			let price = 0;
			let initialAmount = what.amount;
			let finalAmount = 0;
			for(let i = 0; i < amount; i++) {
				if(price + what.getPrice(initialAmount+i+1) < Game.money) {
					price += what.getPrice(initialAmount+i);
					finalAmount++;
				}
				else break;
			}
			Game.Spend(price);
			console.log(finalAmount);
			what.amount += finalAmount;
			if(what.type == 'building') Game.buildingsAmount += finalAmount;
		}
		else {
			let price = what.getPrice();
			if (price > Game.money) {
				Game.MessageBox('You don\'t have enough money', 2);
			}
			else {
				Game.Spend(price);
				what.amount++;
				if(what.type == 'building') Game.buildingsAmount++;
				if(what.type == 'share') what.invested += price;
			}
		}
    }

    Game.buyShare = function(share) {
        if (share.price > Game.money) {
            Game.MessageBox('You don\'t have enough money', 2);
        }
        else {
            Game.Spend(share.price);
            Game.stockmarket.balance -= share.price;
            share.owned++;
            share.invested += share.price
        }
    }

    Game.sell = function (what) {
        if (what.amount <= 0) {
            Game.MessageBox('You can\'t sell any more of that', 2);
        }
        else {
			var percent = 0;
			switch (what.type) {
				case 'building': 
					percent = Game.buildingsPriceReduction; 
					Game.buildingsAmount--;
					break;
				case 'workers': percent = Game.workersPriceReduction; break;
			}
            what.amount--;
            Game.GetRawMoney(subtractPercent(what.price * 0.69, percent));
        }
    }

    Game.sellShare = function (share) {
        if (share.owned <= 0) {
            Game.MessageBox('Nie można już więcej sprzedać', 2);
        }
        else {
            share.owned--;
            Game.GetRawMoney(share.price);
            Game.stockmarket.balance += share.price;
            share.invested -= share.price;
        }
    }

    Game.buyMax = function (what, _return) {
        var percent = 0;
        switch (what.type) {
            case 'building': percent = Game.buildingsPriceReduction; break;
            case 'workers': percent = Game.workersPriceReduction; break;
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
			if(what.type == 'building') Game.buildingsAmount += afford;
        }
    }

    Game.sellAll = function (what, _return) {
        var percent = 0;
        switch (what.type) {
            case 'building': percent = Game.buildingsPriceReduction; break;
            case 'workers': percent = Game.workersPriceReduction; break;
        }
        var money = subtractPercent((what.basePrice * (Math.pow(1.15, what.amount) - 1) / 0.15) * 0.69, percent);
        if (_return)
            return money;
        else {
            Game.GetRawMoney(money);
			var amount = what.amount;
            what.amount = 0;
			if(what.type == 'building') Game.buildingsAmount -= amount;
        }
    }

    Game.buyAllShares = function (share) {
		if(Game.money < share.price) {
			Game.MessageBox('You don\'t have enough money', 2);
		}
		else {
			var owned = parseInt(Game.money / share.price);
			var money = share.price * owned;
			share.invested += money;
			share.owned += owned;
			Game.Spend(money);
			Game.stockmarket.balance -= money;
			Game.MessageBox('You have bought <strong>' + Beautify(owned) + '</strong> shares for <strong class="money-bg">' + Beautify(money) + '</strong>', 0);
		}
    }

    Game.sellAllShares = function (share) {
		var owned = share.owned;
        var money = share.price * share.owned;
        share.owned = 0;
        share.invested = 0;
        Game.GetRawMoney(money);
        Game.stockmarket.balance += money;
		Game.MessageBox('You have sold <strong>' + Beautify(owned) + '</stong> shares for <strong class="money-bg">' + Beautify(money) + '</strong>', 0);
    }
	
	//LOTTERY

    Game.StartLottery = function (numbers, regular) {
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

        var prizes = [0.00035, 0.001, 7, 25, 100];
		Game.lottery.timesPlayed++;
        if (won) {
            Game.lottery.timesWon++;
			
            var prize = Game.subtractTax((Game.lottery.pool) * (!regular ? Math.pow((parseFloat($('#lottery-custom-price-input').val()) / Game.lottery.ticket), 1 / 6) : 1) *(prizes[rightnumbers - 1] / 100));
            Game.MessageBox('You won <strong class="money-bg">' + Beautify(prize) + '</strong>. <br/>You scored ' + rightnumbers + (rightnumbers == 1 ? ' number' : ' numbers'), 0);
            Game.GetMoney(prize);
            Game.lottery.balance += prize;
            switch (rightnumbers) {
                case 1: Game.lottery.scores[0]++; break;
                case 2: Game.lottery.scores[1]++; break;
                case 3: Game.lottery.scores[2]++; break;
                case 4: Game.lottery.scores[3]++; break;
                case 5: Game.lottery.scores[4]++;Game.UnlockAchievement('I guess I\'m rich now'); break;
            }
        }
        else {
            Game.lottery.timesLost++;
            Game.MessageBox('You didn\'t score any number', 2);
        }
        Game.lottery.blocked = true;
        setTimeout(function () { Game.lottery.blocked = false; }, Game.lottery.blockTime * 1000);

        $('#lottery-numbers').text(randomNumbers.join(' '));
    }

	//CALCULATING SHARES 
	
    Game.CalculateSharePriceChange = function (share) {
        return ((share.price - share.lastPrice)/share.lastPrice * 100).toFixed(2);
    }

    Game.CalculateShareProfit = function (share) {
        return share.owned * share.price;
    }

    Game.CalculateShareProfitPercentage = function (share) {
        return ((share.owned * share.price - share.invested) / share.invested * 100).toFixed(2);
    }
	
	//CALCULATING STUFF

    Game.CalculateTier = function (cumulativeGains) {
        return Math.round(Math.pow(cumulativeGains, 1 / 10));
    }
	
	Game.CalculateResetRewardMultiplier = function () {
        return 100 + Math.floor((Math.pow(Game.allMoneyEarned, 1/6)));
    }
	
	//CONTENT RELATED

    Game.UnlockAchievement = function (achievementName) {
        for (var i = 0; i < Game.achievements.length; i++) {
            if (Game.achievements[i].name == achievementName && !Game.achievements[i].unlocked) {
                Game.achievements[i].unlocked = true;
				Game.achievementsUnlocked++;
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
	
	Game.GetMyShares = function () {
        var shares = [];
        for (var i = 0; i < Game.shares.length; i++) {
            if (Game.shares[i].owned > 0) shares.push(Game.shares[i]);
        }
        return shares;
    }

    Game.GetShareById = function (id) {
        for (var i = 0; i < Game.shares.length; i++) {
            if (Game.shares[i].id == id) return Game.shares[i];
        }
    }

    Game.GetUpgrade = function (upgradeName) {
        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].name == upgradeName) {
                return Game.upgrades[i];
            }
        }
    }
	
	Game.DisableUpgradeCooldown = function (upgradeName) {
		var upgrade = Game.GetUpgrade(upgradeName);
		if(upgrade) {
			upgrade.cooldownRemaining = upgrade.cooldown;
			upgrade.cooldownOn = false;
			upgrade.disabled = false;
			//if(upgrade.onCooldown !== undefined ) upgrade.onCooldown();
		}
	};

    Game.Unlocked = function (name) {
        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].name == name && Game.upgrades[i].unlocked) {
                return true;
            }
        }
        return false;
    }

    //TOOLTIPS

    Game.Tooltip = {}; //fix

    Game.addTooltip = function (what, text) { //zrobic Game.Tooltip.add
        $(what).attr('data-tooltip', text);

        $(what).on('mouseover', function () {
			var tooltip = $("#tooltip");
			tooltip.html($(what).attr('data-tooltip'));
			tooltip.show();
			tooltip.css({
                'top': $(what).offset().top - tooltip.outerHeight() - 10,
                'left': $(what).offset().left - (tooltip.outerWidth() / 2) + ($(what).outerWidth() / 2)
            })
			if(tooltip.offset().top < $(window).scrollTop()) tooltip.css('top', $(what).offset().top + $(what).outerHeight() + 10);	
			if(tooltip.offset().left < 0) tooltip.css('left', 0);
        });

        $(what).on('mouseout', function () {
            $("#tooltip").hide();
        });
    }

    Game.removeTooltip = function (what) {
        $(what).removeAttr('data-tooltip');
        $(what).unbind('mouseover mouseout');
    }

    Game.updateTooltip = function (what, text) {
        getId(what).setAttribute('data-tooltip', text);
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
            $('#prompt-content').append('<button id="prompt-option' + (i + 1) + '" class="prompt-option">' + options[i].name + '</button>');
            $('#prompt-option' + (i + 1)).on('click', options[i].click);
        }
		$('#prompt').css("top", ($(window).innerHeight() - $('#prompt').outerHeight()) / 2 + $(window).scrollTop() + "px"); //FIX
        $('#prompt').css("left", ($(window).innerWidth() - $('#prompt').outerWidth()) / 2 + "px");
    }

    Game.ClosePrompt = function () {
        $('#prompt').hide();
        $('#cover').hide();
        $('.prompt-option').unbind('click');
    }

    Game.SetOptions = function () {
		if(Game.options.lotteryRegularTicket) 
			$('#lottery-regular-price').prop('checked', true);
		else
			$('#lottery-custom-price').prop('checked', true);
		$('#lottery-custom-price-input').val(Game.options.lotteryCustomTicketPrice > 0 ? Game.options.lotteryCustomTicketPrice : '');
		$('.lottery-number').each(function(i){
			if(Game.options.lotteryNumbers[i] > 0)$(this).val(Game.options.lotteryNumbers[i]);
		});
        Game.fps = Game.options.fps;
        $('#option-fps').val(Game.options.fps);
        $('#option-autosave').prop('checked', Game.options.autoSave);
        $('#option-autosave-time').val(Game.options.autoSaveTime);
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
		this.getPrice = function(amount) {
			return Game.addTax(subtractPercent(Math.pow(1.15, amount !== undefined ? amount : this.amount) * this.basePrice, Game.buildingsPriceReduction));
		}
    }

    Game.Upgrade = function (id, name, desc, basePrice, effect, multiple, hidden, cooldown, onCooldown) {
        this.id = id;
        this.name = name;
        this.desc = desc;
        this.unlocked = false;
        this.price = basePrice;
        this.basePrice = this.price;
        this.effect = effect;
        this.multiple = multiple ? true : false;
        this.hidden = hidden ? true : false;
		this.cooldown = cooldown;
		this.cooldownOn = false;
		this.cooldownRemaining = cooldown;
		this.onCooldown = onCooldown;
        this.used = 0;
        this.disabled = false;
    }

    Game.Share = function (id, companyName, currentPrice, minChangePercent, maxChangePercent, minPrice, maxPrice) {
        this.id = id;
        this.type = 'share';
        this.companyName = companyName;
        this.price = currentPrice;
        this.lastPrice = currentPrice;
        this.minChangePercent = minChangePercent;
        this.maxChangePercent = maxChangePercent;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.owned = 0;
        this.invested = 0;
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
	Game.upgradesWithCooldown = [];
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
			
	Game.upgrades.push(new Game.Upgrade(108, 'Upgrade of unknown', 'Increases the income multiplier by a random number ranging from <strong>100 to 200</strong>', 5000000000000000,
            function () {
				var multiplier = getRandom(100, 200);
                Game.incomeMultiplier += multiplier;
				Game.MessageBox('Your income multiplier has been increased by <strong>' + multiplier + '</strong', 0)
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
			
	Game.upgrades.push(new Game.Upgrade(34, 'Final bonus booster', 'Increases the bonus multiplier by <strong>2 times</strong>', 30000000000000,
            function () {
                Game.bonusMultiplier *= 2;
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

    Game.upgrades.push(new Game.Upgrade(91, 'Faster than light', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>3 times</strong>', 300000000000,
            function () {
                Game.ultraBonusMultiplier *= 3;
            }));

    Game.upgrades.push(new Game.Upgrade(97, 'Faster than light #2', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>3 times</strong>', 30000000000000,
            function () {
                Game.ultraBonusMultiplier *= 3;
            }));
			
    Game.upgrades.push(new Game.Upgrade(98, 'Faster than light #3', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>3 times</strong>', 30000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 3;
            }));
			
    Game.upgrades.push(new Game.Upgrade(99, 'Faster than light #4', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>3 times</strong>', 300000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 3;
            }));
		
    Game.upgrades.push(new Game.Upgrade(100, 'Faster than light #5', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>3 times</strong>', 3000000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 3;
            }));
			
	Game.upgrades.push(new Game.Upgrade(101, 'Faster than light #6', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>3 times</strong>', 30000000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 3;
            }));
			
	Game.upgrades.push(new Game.Upgrade(104, 'Faster than light #7', 'Increases the <strong>ultra</strong> bonus multiplier by <strong>3 times</strong>', 300000000000000000000,
            function () {
                Game.ultraBonusMultiplier *= 3;
            }, false, true));

    Game.upgrades.push(new Game.Upgrade(92, 'Give me some chances #1', 'Increases the <strong>ultra</strong> bonus probability by <strong>1%</strong>', 3000000000000,
            function () {
                Game.ultraBonusProbability += 1;
            }));

    Game.upgrades.push(new Game.Upgrade(93, 'Give me some chances #2', 'Increases the <strong>ultra</strong> bonus probability by <strong>1%</strong>', 30000000000000,
            function () {
                Game.ultraBonusProbability += 1;
            }));

    Game.upgrades.push(new Game.Upgrade(94, 'Give me some chances #3', 'Increases the <strong>ultra</strong> bonus probability by <strong>1%</strong>', 3000000000000000,
            function () {
                Game.ultraBonusProbability += 1;
            }));
			
    Game.upgrades.push(new Game.Upgrade(95, 'Give me some chances #4', 'Increases the <strong>ultra</strong> bonus probability by <strong>1%</strong>', 30000000000000000,
            function () {
                Game.ultraBonusProbability += 1;
            }));
			
    Game.upgrades.push(new Game.Upgrade(96, 'Give me some chances #5', 'Increases the <strong>ultra</strong> bonus probability by <strong>1%</strong>', 3000000000000000000,
            function () {
                Game.ultraBonusProbability += 1;
            }));

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

    Game.upgrades.push(new Game.Upgrade(39, 'Longer bonus #5', 'Increases the bonus duration time by <strong>40 seconds</strong>', 1500000000000000,
			function () {
				Game.bonusTime += 40;
				Game.bonusTimeRemaining += 40;
			}));

    Game.upgrades.push(new Game.Upgrade(40, 'Eternal bonus', 'Increases the bonus duration time by <strong>50 seconds</strong>', 6666666666666666666,
			function () {
				Game.bonusTime += 50;
				Game.bonusTimeRemaining += 50;
			}, false, true));

    Game.upgrades.push(new Game.Upgrade(41, 'Money smells good', 'Lowers the time when you get money from the bank by <strong>10 seconds</strong>', 50000000000,
			function () {
				Game.bank.moneyIncreaseTime -= 10;
				if(Game.bank.remainingTime >= 10) 
					Game.bank.remainingTime -= 10;
				else
					Game.bank.remainingTime = 0;
			}));

    Game.upgrades.push(new Game.Upgrade(42, 'Money smells good #2', 'Lowers the time when you get money from the bank by <strong>10 seconds</strong>', 75000000000,
			function () {
				Game.bank.moneyIncreaseTime -= 10;
				if(Game.bank.remainingTime >= 10) 
					Game.bank.remainingTime -= 10;
				else
					Game.bank.remainingTime = 0;
			}));

    Game.upgrades.push(new Game.Upgrade(43, 'Money smells good #3', 'Lowers the time when you get money from the bank by <strong>10 seconds</strong>', 100000000000,
			function () {
				Game.bank.moneyIncreaseTime -= 10;
				if(Game.bank.remainingTime >= 10) 
					Game.bank.remainingTime -= 10;
				else
					Game.bank.remainingTime = 0;
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
			
	Game.upgrades.push(new Game.Upgrade(72, 'Jackpot', 'Increases lottery pool multiplier by <strong>30%</strong>', 1000000000000,
            function () {
                Game.lottery.poolMultiplier += 0.30;
            }, false, true));

    Game.upgrades.push(new Game.Upgrade(84, 'No limits', 'Makes the lottery block time last <strong>1 second</strong>', 123456787654321,
            function () {
                Game.lottery.blockTime = 1;
            }, false, true));
			
	Game.upgrades.push(new Game.Upgrade(105, 'Stock market rush #1', 'Decreases the stock market update time by <strong>5 seconds</strong>', 5555555555,
            function () {
                Game.stockmarket.updateTime -= 5;
            }));
			
	Game.upgrades.push(new Game.Upgrade(106, 'Stock market rush #2', 'Decreases the stock market update time by <strong>5 seconds</strong>', 5555555555555,
            function () {
                Game.stockmarket.updateTime -= 5;
            }));
			
	Game.upgrades.push(new Game.Upgrade(107, 'Stock market rush #3', 'Decreases the stock market update time by <strong>5 seconds</strong>', 5555555555555555,
            function () {
                Game.stockmarket.updateTime -= 5;
            }));
			
    Game.upgrades.push(new Game.Upgrade(55, 'Buildings sale #1', 'Lowers the price of all buildings by <strong>10%</strong>', 1000000000, function() {
		Game.buildingsPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(56, 'Buildings sale #2', 'Lowers the price of all buildings by <strong>10%</strong>', 10000000000, function() {
		Game.buildingsPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(57, 'Buildings sale #3', 'Lowers the price of all buildings by <strong>10%</strong>', 100000000000, function() {
		Game.buildingsPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(58, 'Buildings sale #4', 'Lowers the price of all buildings by <strong>10%</strong>', 1000000000000, function() {
		Game.buildingsPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(59, 'Buildings sale #5', 'Lowers the price of all buildings by <strong>10%</strong>', 10000000000000, function() {
		Game.buildingsPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(60, 'Minimum wage #1', 'Lowers the workers price by <strong>10%</strong>', 1000000000, function() {
		Game.workersPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(61, 'Minimum wage #2', 'Lowers the workers price by <strong>10%</strong>', 10000000000, function() {
		Game.workersPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(62, 'Minimum wage #3', 'Lowers the workers price by <strong>10%</strong>', 100000000000, function() {
		Game.workersPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(63, 'Minimum wage #4', 'Lowers the workers price by <strong>10%</strong>', 1000000000000, function() {
		Game.workersPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(64, 'Minimum wage #5', 'Lowers the workers price by <strong>10%</strong>', 10000000000000, function() {
		Game.workersPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(65, 'Engineering getting cheap #1', 'Lowers the price of all upgrades by <strong>10%</strong>', 100000000000, function() {
		Game.upgradesPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(66, 'Engineering getting cheap #2', 'Lowers the price of all upgrades by <strong>10%</strong>', 1000000000000, function() {
		Game.upgradesPriceReduction += 10;
	}));

    Game.upgrades.push(new Game.Upgrade(67, 'Engineering getting cheap #3', 'Lowers the price of all upgrades by <strong>10%</strong>', 10000000000000, function() {
		Game.upgradesPriceReduction += 10;
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
		   
	Game.upgrades.push(new Game.Upgrade(103, 'Use the whip', 'Workers work at <strong>500%</strong> efficiency for <strong>5 minutes</strong>. Each use reduces this effect by <strong>7%</strong>', 1000000000,
            function () {
                var data = this;
				data.maxEfficiency = Game.workers.maxEfficiency;		
				Game.workers.maxEfficiency = 500 - (data.used * 7) < data.maxEfficiency ? data.maxEfficiency : 500 - (data.used * 7);
				$(window).on('beforeunload', function () {
                    if (data.cooldownOn) {
                        Game.workers.maxEfficiency = data.maxEfficiency;
                        Game.WriteSave(false, true);
                    }
                });
            }, true, false, 5 * 60, function() {
				var data = this;
				Game.workers.maxEfficiency = data.maxEfficiency;
			}));

    Game.upgrades.push(new Game.Upgrade(71, 'Mysterious upgrade', 'Dare to click?', 1000000000,
           function () {
               var rand = getRandom(1, Game.GetMyShares().length > 0 ? 4 : 3);
               var positive = getRandom(1, 100) > (100 - 65) ? true : false;
               
               switch (rand) {
                   case 1: //MONEY
						var money = getRandom(0.03 * Game.moneyEarned, 0.18 * Game.moneyEarned);
						if(positive) {
							Game.GetRawMoney(money);
							Game.MessageBox('You just got <strong class="money-bg">' + Beautify(money) + '</strong>', 0);						
						}
						else if (Math.floor(money * 0.7) > Game.money) {
							Game.MessageBox('You just lost <strong class="money-bg">' + Beautify(Game.money) + '</strong>', 2);
							Game.money = 0;
						}
						else {
							Game.Spend(Math.floor(money * 0.7));
							Game.MessageBox('You just lost <strong class="money-bg">' + Beautify(Math.floor(money * 0.7)) + '</strong>', 2);
						}
                       break;
                   case 2: //BUILDINGS
						var building = getRandom(0, Game.buildings.length - 1);
						var units = getRandom(1, 18);
						if(positive) {
							Game.buildings[building].amount += units;
							Game.MessageBox('You just got <strong>' + units + '</strong> units of <strong>' + Game.buildings[building].name + '</strong>', 0);
						}
						else if(Math.floor(units * 0.7) > Game.buildings[building].amount) {
							Game.MessageBox('You just lost <strong>' + Game.buildings[building].amount + '</strong> units of <strong>' + Game.buildings[building].name + '</strong>', 2);
							Game.buildings[building].amount = 0;
						}
						else {
							Game.buildings[building].amount -= Math.floor(units * 0.7);
							Game.MessageBox('You just lost <strong>' + Math.floor(units * 0.7) + '</strong> units of <strong>' + Game.buildings[building].name + '</strong>', 2);
						}						
					   break;
                       
                   case 3: //WORKERS
						var units = getRandom(1, 18);
						if(positive) {
							Game.workers.amount += units;
							Game.MessageBox('You just got <strong>' + units + '</strong> units of <strong>workers</strong>', 0);
						}
						else if (Math.floor(units * 0.7) > Game.workers.amount) {
							Game.MessageBox('You just lost <strong>' + Game.workers.amount + '</strong> units of <strong>workers</strong>', 2);
							Game.workers.amount = 0;
						}
						else {
							Game.workers.amount -= Math.floor(units * 0.7);
							Game.MessageBox('You just lost <strong>' + Math.floor(units * 0.7) + '</strong> units of <strong>workers</strong>', 2);
						}
                       break;                  
                   case 4: //STOCKS     
						var moneyInvested = Math.floor(getRandomFloat(0.20, 1) * (Game.rawIncome * 100000) + (Game.moneyEarned / 70) + (Game.bank.difference / 70) + (Game.lottery.balance / 70));
						var shares = [];
						for(var i = 0; i < Game.shares.length; i++) {
							if(Game.shares[i].price < moneyInvested) shares.push(i);
						}
						var share = shares[Math.floor(Math.random() * shares.length)];
						var units = Math.floor(moneyInvested / Game.shares[share].price);
						
						if(positive) {
							Game.shares[share].owned += units;
							Game.shares[share].invested += moneyInvested;
							Game.MessageBox('You just got <strong>' + Beautify(units) + '</strong> shares of <strong>' + Game.shares[share].companyName + '</strong>', 0);
						}
						else {
							var shares = [];
							var myshares = Game.GetMyShares();
							moneyInvested *= 0.7;
							Math.floor(moneyInvested);
							for(var i = 0; i < myshares.length; i++) {
								if(myshares[i].price < moneyInvested) shares.push(i);
							}
							var share = myshares[shares[Math.floor(Math.random() * shares.length)]];
							var units = Math.floor(getRandomFloat(0.20, 1) * (moneyInvested / share.price));
							if(units > share.owned) {
								Game.MessageBox('You just lost <strong>' + Beautify(share.owned) + '</strong> shares of <strong>' + share.companyName + '</strong>', 2);
								share.owned = 0;
								share.invested = 0;
							}
							else {
								share.owned -= units;
								share.invested -= moneyInvested;
								Game.MessageBox('You just lost <strong>' + Beautify(units) + '</strong> shares of <strong>' + share.companyName + '</strong>', 2);
							}
						}
						break;
               }        
           }, true, true));

    Game.upgrades.push(new Game.Upgrade(90, 'Bonus on demand', 'Lets you trigger </strong>bonus</strong> whenever you want', 1000000000,
            function () {
                Game.bonus = true;
                Game.bonusCount++;
                var rand = getRandom(1, 100);
                var ultraBonus = rand > (100 - Game.ultraBonusProbability - 2) ? true : false;
                if (ultraBonus) {
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
			
	Game.upgrades.push(new Game.Upgrade(102, 'Money reclaim', 'Get all your money spent on tax back.', 100,
            function () {
                Game.GetRawMoney(Game.moneySpentOnTax);
				Game.MessageBox('You have got <strong class="money-bg">' + Beautify(Game.moneySpentOnTax) + '</strong> back', 0);
				Game.moneySpentOnTax = 0;
            }));

    Game.upgrades.push(new Game.Upgrade(75, 'Tax Be Gone', 'Freezes tax rate for <strong>5 minutes</strong>', 123456789,
            function () {
                var data = this;
                data.tax = Game.tax;
                Game.tax = 0;
                Game.GetUpgrade('Riot').disabled = true;
                Game.GetUpgrade('Riot #2').disabled = true;
                $(window).on('beforeunload', function () {
                    if (data.cooldownOn) {
                        Game.tax = data.tax;
                        Game.WriteSave(false, true);
                    }
                });
            }, true, false, 5 * 60, function() {
				var data = this;
				Game.tax = data.tax;
				Game.GetUpgrade('Riot').disabled = false;
                Game.GetUpgrade('Riot #2').disabled = false;
			}));

    Game.upgrades.push(new Game.Upgrade(76, 'Restoration', 'Lets you get a specified amount of total earned money back', 1234567890,
            function () {
                Game.Prompt('<div>Total money earned: <strong>$' + Beautify(Game.moneyEarned) + '</strong></div><div>How much money of your total earned money you want to restore</div><div id="restoration-error"></div><input type="text" id="restoration-value" style="display: block;width: 100%;"/>', [{
                    name: 'Max', click: function () {
                        getId('restoration-value').value = parseInt(Game.moneyEarned); //FIX
                        }
                    }, {
                    name: 'Restore', click: function () {
                        var value = getId('restoration-value').value;
                        var money = parseInt(value);
                        if (value > 0) {
                            var money = parseInt(value);
                            if (Game.moneyEarned < money) {
                                getId('restoration-error').innerHTML = "You don't have enough money";
                            }
                            else {
                                Game.GetRawMoney(money);
                                Game.moneyEarned -= money;
                                Game.MessageBox('You restored <strong class="money-bg">' + Beautify(money) + '</strong>', 0);
                                Game.ClosePrompt();
                            }
                        }
                    }
                }])
                getId('restoration-value').focus();
            }, true));

    Game.shares = [];
    Game.shares.push(new Game.Share(1, 'Cheap Coal', 1000, 2, 10 , 750, 1550));
    Game.shares.push(new Game.Share(2, 'Universal Resources', 20000, 1, 8, 16000, 25500));
	Game.shares.push(new Game.Share(3, 'Coal Energy', 500000, 3, 7, 320000, 800000));
	Game.shares.push(new Game.Share(4, 'American Mining', 10000000, 2, 6, 4000000, 15000000));
	Game.shares.push(new Game.Share(5, 'Chinese Coal Group', 7000000000000, 2, 5, 5000000000000, 9000000000000));
	Game.shares.push(new Game.Share(6, 'EnergyCore', 8000000000000000, 4, 7, 3500000000000000, 9000000000000000));
	Game.shares.push(new Game.Share(7, 'X Enterprises', 100000000000000000000, 5, 9, 50000000000000000000, 230000000000000000000));
	
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
	Game.achievements.push(new Game.Achievement(30, 'Employer #2', 'Hire <strong>200</strong> workers'));
    Game.achievements.push(new Game.Achievement(16, 'Booster', 'Get bonus <strong>100</strong> times'));
    Game.achievements.push(new Game.Achievement(17, 'Multiplication', 'Get bonus <strong>1000</strong> times'));
	Game.achievements.push(new Game.Achievement(29, 'Finally!', 'Get bonus <strong>ultra bonus</strong> at least <strong>once</strong>'));
    Game.achievements.push(new Game.Achievement(18, 'Addicted', 'Play this game for <strong>a week</strong>'));
    Game.achievements.push(new Game.Achievement(19, 'Money saver', 'Save <strong>$' + Beautify(100000000000) + '</strong> in bank'));
    Game.achievements.push(new Game.Achievement(20, 'The wait was worth', 'Save <strong>$' + Beautify(100000000000000) + '</strong> in bank'));
	Game.achievements.push(new Game.Achievement(31, 'Hoarder', 'Save <strong>$' + Beautify(100000000000000000) + '</strong> in bank'));
    Game.achievements.push(new Game.Achievement(21, 'Lucky one', 'Win the lottery <strong>777</strong> times'));
    Game.achievements.push(new Game.Achievement(22, 'Not that bad', 'Score <strong>three numbers 30 times</strong> in the lottery'));
    Game.achievements.push(new Game.Achievement(23, 'Plain lucky', 'Score <strong>four numbers 5 times</strong> in the lottery'));
    Game.achievements.push(new Game.Achievement(24, 'I guess I\'m rich now', 'Score <strong>five numbers</strong> in the lottery'));
    Game.achievements.push(new Game.Achievement(25, 'Sacrifice', '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999) + '</strong> money earned'));
    Game.achievements.push(new Game.Achievement(26, 'Where did it all go?', '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999999) + '</strong> money earned'));
	
	for(let i = 0; i < Game.upgrades.length; i++) {
		if(Game.upgrades[i].cooldown !== undefined) Game.upgradesWithCooldown.push(Game.upgrades[i].name); 
	}

    /*=================================================
    INITIAL DRAWING
    ==================================================*/
    Game.Draw = function () {
        Game.addTooltip('#reset', 'Resets all your progress but the achievements unlocked');
        Game.addTooltip('#option-fps', 'Frames per second');
        Game.addTooltip('#option-autosave-time', 'How often auto-save will do its thing');
        Game.addTooltip('#option-numbers', 'How numbers are shown');
        Game.addTooltip('#buy-max-workers', 'It\'ll hire <strong>' + Game.buyMax(Game.workers, true) + '</strong> workers');
        Game.addTooltip('#sell-all-workers', 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.workers, true)) + '</strong> back ');
        /*
        0 - green
        1 - yellow
        2 - red
        */
        Game.MessageBox = function (text, type, closeTime) {
            $('.view').each(function () {
                if ($(this).css('display') == 'block') {
                    var color = '';
                    switch (type) {
                        case 0:
                            color = 'green'; break;
                        case 1:
                            color = 'yellow'; break;
                        case 2:
                            color = 'red'; break;
                        default:
                            color = 'green'; break;
                    }
					var messagebox = $(this).find('.messagebox');
                    messagebox.attr('class', 'messagebox ' + color);
                    messagebox.show()
                    messagebox.find('.messageboxtext').html(text);
					if(Game.messageBoxTimeout !== undefined ) clearTimeout(Game.messageBoxTimeout);
					Game.messageBoxTimeout = setTimeout(function() { 
						messagebox.fadeOut(200); 
					}, closeTime !== undefined ? closeTime * 1000 : 7000);
                }
            });
        }

        //BUILDINGS

        for (var i = 0; i < Game.buildings.length; i++) {
            $('#mining .content').append('<div id=building-item' + (i + 1) + ' class="building-item"/>');
            $('#building-item' + (i + 1)).append('<div id=building-info' + (i + 1) + ' class="building-info"/>');
            $('#building-info' + (i + 1)).append('<div id=building-name' + (i + 1) + ' class="building-name">' + Game.buildings[i].name + '</div>');
            $('#building-info' + (i + 1)).append('<div id=building-amount' + (i + 1) + ' class="building-amount"/>');
            $('#building-info' + (i + 1)).append('<div id=building-tier' + (i + 1) + ' class="building-tier"/>');
            $('#building-info' + (i + 1)).append('<div id=building-price' + (i + 1) + ' class="building-price money-bg"/>');
            $('#building-item' + (i + 1)).append('<div class="sell-building sell-buy">Sell</div>');
            $('#building-item' + (i + 1)).append('<div id=sell-all-buildings' + (i + 1) + ' class="sell-all-buildings sell-buy">Sell All</div>');
            $('#building-item' + (i + 1)).append('<div class="buy-building sell-buy">Buy</div>');
            $('#building-item' + (i + 1)).append('<div id=buy-max-buildings' + (i + 1) + ' class="buy-max-buildings sell-buy">Buy Max</div>');
			$('#building-item' + (i + 1)).append('<div id=upgrade-building' + (i + 1) + ' class="upgrade-building sell-buy">Upgrade</div>');
            Game.addTooltip('#buy-max-buildings' + (i + 1), 'It\'ll buy <strong>' + Game.buyMax(Game.buildings[i], true) + '</strong> units of ' + Game.buildings[i].name);
            Game.addTooltip('#sell-all-buildings' + (i + 1), 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.buildings[i], true)) + '</strong> back ');
        }

        //UPGRADES
		$('#upgrades-list').append('<div class="upgrades-delimiter">Income multiplier</div>');
        for (var i = 0; i < Game.upgrades.length; i++) {
            $('#upgrades-list').append('<div id=upgrade' + (i + 1) + ' class="upgrade active-upgrade"/>');
			if(Game.upgrades.indexOf(Game.GetUpgrade('Bonus booster')) == i+1) $('#upgrades-list').append('<div class="upgrades-delimiter">Bonus</div>');
			if(Game.upgrades.indexOf(Game.GetUpgrade('Money smells good')) == i+1) $('#upgrades-list').append('<div class="upgrades-delimiter">Bank</div>');
			if(Game.upgrades.indexOf(Game.GetUpgrade('Greater chance')) == i+1) $('#upgrades-list').append('<div class="upgrades-delimiter">Lottery</div>');
			if(Game.upgrades.indexOf(Game.GetUpgrade('Stock market rush #1')) == i+1) $('#upgrades-list').append('<div class="upgrades-delimiter">Stock market</div>');
			if(Game.upgrades.indexOf(Game.GetUpgrade('Buildings sale #1')) == i+1) $('#upgrades-list').append('<div class="upgrades-delimiter">Miscellaneous</div>');
            Game.addTooltip('#upgrade' + (i + 1), '');
        }

        //STOCK MARKET
		
        for (var i = 0; i < Game.shares.length; i++) {
            $('#stockmarket-table').append('<tr class="share"><td data-label="Name" class="name"></td>' +
                '<td data-label="Current Price" class="price"></td>' +
                '<td data-label="Change" class="change"></td>' +
                '<td data-label="Buy"><button class="buy">Buy</button></td>' +
                '<td data-label="Buy All"><button class="buy-all">Buy all</button></td></tr>');
        }

        //STATISTICS

        function createRow(name) {
            $('#statistics-table').append('<tr><td>' + name + '</td><td class="trValue"></td></tr>');
        }
		
		function createDelimeter(name) {
            $('#statistics-table').append('<tr class="statistics-delimeter"><td colspan="2">' + name + '</td></tr>');
        }

        createRow('Playing time');
        createRow('Money earned during entire gameplay');
        createRow('Money earned since last reset');
        createRow('Income per minute');
        createRow('Income per hour');
        createRow('Income multiplier');
        createRow('Times you reset');
		createRow('Money spent on tax');
        createRow('Money spent on upgrades');
		createRow('Total salary paid to workers');
		createRow('Total buildings owned');
		createDelimeter('Bonus');
        createRow('Times got bonus');
		createRow('Times got ultra bonus');
		createDelimeter('Bank');
        createRow('Money saved in bank');
        createRow('Bank cap');
		createDelimeter('Lottery');
        createRow('Lottery wins');
        createRow('Lottery losses');
        createRow('Lottery win percentage');
        createRow('Lottery balance');
        createRow('Money spent on lottery tickets');

        for (var i = 0; i < Game.lottery.scores.length; i++) {
            createRow('Times scored ' + [i + 1] + (i + 1 == 1 ? ' number' : ' numbers'));
        }
		
		createDelimeter('Cumulative income');
        createRow('Cumulative income from workers');

        for (var i = 0; i < Game.buildings.length; i++) {
            createRow('Cumulative income from ' + Game.buildings[i].name);
        }
		
		createDelimeter('Cumulative gains');
		createRow('Cumulative gains from workers');
		
		for (var i = 0; i < Game.buildings.length; i++) {
            createRow('Cumulative gains from ' + Game.buildings[i].name);
        }
		
		createRow('Total cumulative gains');

        //ACHIEVEMENTS

        for (var i = 0; i < Game.achievements.length; i++) {
            $('#achievements .content').append('<div id=achievement' + (i + 1) + ' class="achievement" style="display: none;"/>');
            Game.addTooltip('#achievement' + (i + 1), '<div>' + Game.achievements[i].name + '</div><div>' + Game.achievements[i].desc + '</div>');
        }

        console.info('Initial drawing completed');
    }
	
	//GAME SAVE

    Game.WriteSave = function (exporting, autosave) {
        var save = {};
        save.moneyEarned = Game.moneyEarned;
        save.money = Game.money;
        save.incomeMultiplier = Game.incomeMultiplier;
		save.buildingsAmount = Game.buildingsAmount;
		save.upgradesUnlocked =  Game.upgradesUnlocked;
		save.achievementsUnlocked = Game.achievementsUnlocked;
		save.buildingsPriceReduction = Game.buildingsPriceReduction;
		save.workersPriceReduction = Game.workersPriceReduction;
		save.upgradesPriceReduction = Game.upgradesPriceReduction;
        save.spentOnUpgrades = Game.spentOnUpgrades;
		save.workers = {};
        save.workers.amount = Game.workers.amount;
        save.workers.salaryPaid = Game.workers.salaryPaid;
        save.workers.maxEfficiency = Game.workers.maxEfficiency;
        save.workers.cumulativeGains = Game.workers.cumulativeGains;
        save.bonusMultiplier = Game.bonusMultiplier;
        save.ultraBonusMultiplier = Game.ultraBonusMultiplier;
        save.ultraBonusProbability = Game.ultraBonusProbability;
        save.bonusCount = Game.bonusCount;
        save.ultraBonusCount = Game.ultraBonusCount;
        save.bonusTime = Game.bonusTime;
        save.bonusMinTime = Game.bonusMinTime;
        save.bonusMaxTime = Game.bonusMaxTime;
		save.bank = {};
        save.bank.storedMoney = Game.bank.storedMoney;
        save.bank.moneyRate = Game.bank.moneyRate;
        save.bank.moneyIncreaseTime = Game.bank.moneyIncreaseTime;
        save.bank.remainingTime = Game.bank.remainingTime;
        save.bank.difference = Game.bank.difference;
        save.bank.depositedMoney = Game.bank.depositedMoney;
        save.bank.moneyCap = Game.bank.moneyCap;
		save.bank.borrowedMoney = Game.bank.borrowedMoney;
        save.bank.loanDebt = Game.bank.loanDebt;
        save.bank.loanRate = Game.bank.loanRate;
        save.bank.loanTime = Game.bank.loanTime;
        save.bank.loanRemainingTime = Game.bank.loanRemainingTime;
        save.firstRun = Game.firstRun;
        save.startTime =  Game.startTime.toUTCString();
		save.lottery = {};
        save.lottery.numberRange = Game.lottery.numberRange;
        save.lottery.balance = Game.lottery.balance;
        save.lottery.ticketsCost = Game.lottery.ticketsCost;
        save.lottery.poolMultiplier = Game.lottery.poolMultiplier;
        save.lottery.timesWon = Game.lottery.timesWon;
		save.lottery.timesPlayed = Game.lottery.timesPlayed;
        save.lottery.timesLost = Game.lottery.timesLost;
        save.lottery.blockTime = Game.lottery.blockTime;
		save.stockmarket = Game.stockmarket;
        save.tax = Game.tax;
        save.moneySpentOnTax = Game.moneySpentOnTax;
		save.options = Game.options;
        save.allMoneyEarned = Game.allMoneyEarned;
        save.resetCount = Game.resetCount;
		
		save.lotteryScores = Game.lottery.scores;
		
		save.buildings = [];
        for (var i = 0; i < Game.buildings.length; i++) {
			save.buildings.push({
				id: Game.buildings[i].id,
				amount: Game.buildings[i].amount,
				cumulativeGains: Game.buildings[i].cumulativeGains,
				tier: Game.buildings[i].tier}
			);
        }

		save.upgrades = [];
        for (var i = 0; i < Game.upgrades.length; i++) {
			save.upgrades.push({
				id: Game.upgrades[i].id,
				unlocked: Game.upgrades[i].unlocked,
				used: Game.upgrades[i].used,
				hidden: Game.upgrades[i].hidden}
			);
        }
		
		save.shares = [];
        for (var i = 0; i < Game.shares.length; i++) {
			save.shares.push({
				id: Game.shares[i].id,
				price: Game.shares[i].price,
				lastPrice: Game.shares[i].lastPrice,
				owned: Game.shares[i].owned,
				invested: Game.shares[i].invested}
			);
        }
		
		save.achievements = [];
        for (var i = 0; i < Game.achievements.length; i++) {
			save.achievements.push({
				id: Game.achievements[i].id,
				unlocked: Game.achievements[i].unlocked}
			);
        }

        str = btoa(JSON.stringify(save));
        if (exporting) {
            return str;
        }
		localStorage.setItem(Game.name, str);
        console.info('Game has been saved');
        if (!autosave) Game.MessageBox('Game saved', 0);
    }

    Game.ExportSave = function () {
        Game.Prompt('<div>Copy this save</div><textarea id="export-save" style="display: block;width: 250px; height: 300px;">' + Game.WriteSave(true) + '</textarea>', [{ name: 'Close', click: function () { Game.ClosePrompt() }}])
        getId('export-save').focus();
        getId('export-save').select();
        Game.MessageBox('Game exported', 0);
    }

    Game.ImportSave = function () {
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
        var save = {};
        if (data !== undefined) {
            save = JSON.parse(atob(data));
        }
        else if (localStorage.getItem(Game.name) !== null && localStorage.getItem(Game.name) !== '') { //FIX
            save = JSON.parse(atob(localStorage.getItem(Game.name)));
        }
        if (Object.keys(save).length > 0) {
            Game.moneyEarned = save.moneyEarned !== undefined ? save.moneyEarned : Game.moneyEarned;
            Game.money = save.money !== undefined ? save.money : Game.money;
            Game.incomeMultiplier = save.incomeMultiplier !== undefined ? save.incomeMultiplier : Game.incomeMultiplier;
			Game.buildingsAmount = save.buildingsAmount !== undefined ? save.buildingsAmount : Game.buildingsAmount;
			Game.upgradesUnlocked = save.upgradesUnlocked !== undefined ? save.upgradesUnlocked : Game.upgradesUnlocked;
			Game.achievementsUnlocked = save.achievementsUnlocked !== undefined ? save.achievementsUnlocked : Game.achievementsUnlocked;
			Game.buildingsPriceReduction = save.buildingsPriceReduction !== undefined ? save.buildingsPriceReduction : Game.buildingsPriceReduction;
			Game.workersPriceReduction = save.workersPriceReduction !== undefined ? save.workersPriceReduction : Game.workersPriceReduction;
			Game.upgradesPriceReduction = save.upgradesPriceReduction !== undefined ? save.upgradesPriceReduction : Game.upgradesPriceReduction;
            Game.spentOnUpgrades = save.spentOnUpgrades !== undefined ? save.spentOnUpgrades : Game.spentOnUpgrades;
            Game.workers.amount = save.workers.amount !== undefined ? save.workers.amount : Game.workers.amount;
            Game.workers.salaryPaid = save.workers.salaryPaid !== undefined ? save.workers.salaryPaid : Game.workers.salaryPaid;
            Game.workers.maxEfficiency = save.workers.maxEfficiency !== undefined ? save.workers.maxEfficiency : Game.workers.maxEfficiency;
            Game.workers.cumulativeGains = save.workers.cumulativeGains !== undefined ? save.workers.cumulativeGains : Game.workers.cumulativeGains;
            Game.bonusMultiplier = save.bonusMultiplier !== undefined ? save.bonusMultiplier : Game.bonusMultiplier;
            Game.bonusCount = save.bonusCount !== undefined ? save.bonusCount : Game.bonusCount;
            Game.ultraBonusMultiplier = save.ultraBonusMultiplier !== undefined ? save.ultraBonusMultiplier : Game.ultraBonusMultiplier;
            Game.ultraBonusProbability = save.ultraBonusProbability !== undefined ? save.ultraBonusProbability : Game.ultraBonusProbability;
            Game.ultraBonusCount = save.ultraBonusCount !== undefined ? save.ultraBonusCount : Game.ultraBonusCount;
            Game.bonusTime = save.bonusTime !== undefined ? save.bonusTime : Game.bonusTime;
            Game.bonusTimeRemaining = save.bonusTime !== undefined ? save.bonusTime : save.bonusTime;
            Game.bonusMinTime = save.bonusMinTime !== undefined ? save.bonusMinTime : Game.bonusMinTime;
            Game.bonusMaxTime = save.bonusMaxTime !== undefined ? save.bonusMaxTime : Game.bonusMaxTime;
            Game.bonusInterval = getRandom(Game.bonusMinTime, Game.bonusMaxTime);
            Game.bank.storedMoney = save.bank.storedMoney !== undefined ? save.bank.storedMoney : Game.bank.storedMoney;
            Game.bank.moneyRate = save.bank.moneyRate !== undefined ? save.bank.moneyRate : Game.bank.moneyRate;
            Game.bank.moneyIncreaseTime = save.bank.moneyIncreaseTime !== undefined ? save.bank.moneyIncreaseTime : Game.bank.moneyIncreaseTime;
            Game.bank.remainingTime = save.bank.remainingTime !== undefined ? save.bank.remainingTime : Game.bank.remainingTime;
            Game.bank.difference = save.bank.difference !== undefined ? save.bank.difference : Game.bank.difference;
            Game.bank.depositedMoney = save.bank.depositedMoney !== undefined ? save.bank.depositedMoney : Game.bank.depositedMoney;
            Game.bank.moneyCap = save.bank.moneyCap !== undefined ? save.bank.moneyCap : Game.bank.moneyCap;
			Game.bank.borrowedMoney = save.bank.borrowedMoney !== undefined ? save.bank.borrowedMoney : Game.bank.borrowedMoney;
            Game.bank.loanDebt = save.bank.loanDebt !== undefined ? save.bank.loanDebt : Game.bank.loanDebt;
            Game.bank.loanRate = save.bank.loanRate !== undefined ? save.bank.loanRate : Game.bank.loanRate;
            Game.bank.loanTime = save.bank.loanTime !== undefined ? save.bank.loanTime : Game.bank.loanTime;
            Game.bank.loanRemainingTime = save.bank.loanRemainingTime !== undefined ? save.bank.loanRemainingTime : Game.bank.loanRemainingTime;
            Game.firstRun = save.firstRun;
            Game.startTime = new Date(save.startTime);
            Game.lottery.numberRange = save.lottery.numberRange !== undefined ? save.lottery.numberRange : Game.lottery.numberRange;
            Game.lottery.balance = save.lottery.balance !== undefined ? save.lottery.balance : Game.lottery.balance;
            Game.lottery.ticketsCost = save.lottery.ticketsCost !== undefined ? save.lottery.ticketsCost : Game.lottery.ticketsCost;
            Game.lottery.poolMultiplier = save.lottery.poolMultiplier !== undefined ? save.lottery.poolMultiplier : Game.lottery.poolMultiplier;
			Game.lottery.timesPlayed = save.lottery.timesPlayed !== undefined ? save.lottery.timesPlayed : Game.lottery.timesPlayed;
            Game.lottery.timesWon = save.lottery.timesWon !== undefined ? save.lottery.timesWon : Game.lottery.timesWon;
            Game.lottery.timesLost = save.lottery.timesLost !== undefined ? save.lottery.timesLost : Game.lottery.timesLost;
            Game.lottery.blockTime = save.lottery.blockTime !== undefined ? save.lottery.blockTime : Game.lottery.blockTime;
			Game.stockmarket = save.stockmarket !== undefined ? save.stockmarket : Game.stockmarket;
            Game.tax = save.tax !== undefined ? save.tax : save.tax;
            Game.moneySpentOnTax = save.moneySpentOnTax !== undefined ? save.moneySpentOnTax : Game.moneySpentOnTax;
            Game.options = save.options !== undefined ? save.options : Game.options;
            Game.allMoneyEarned = save.allMoneyEarned !== undefined ? save.allMoneyEarned : Game.allMoneyEarned;
            Game.resetCount = save.resetCount !== undefined ? save.resetCount : Game.resetCount;

            Game.lottery.scores = save.lotteryScores !== undefined ? save.lotteryScores : Game.lotteryScores;

            for (var i = 0; i < Game.buildings.length; i++) {
				for(var j = 0; j < save.buildings.length; j++) {
					if(Game.buildings[i].id == save.buildings[j].id) {
						Game.buildings[i].amount = save.buildings[j].amount;
						Game.buildings[i].cumulativeGains = save.buildings[j].cumulativeGains;
						Game.buildings[i].tier = save.buildings[j].tier;
					}
				}
            }
			
			for (var i = 0; i < Game.upgrades.length; i++) {
				for(var j = 0; j < save.upgrades.length; j++) {
					if(Game.upgrades[i].id == save.upgrades[j].id) {
						Game.upgrades[i].unlocked = save.upgrades[j].unlocked;
						Game.upgrades[i].used = save.upgrades[j].used;
						Game.upgrades[i].hidden = save.upgrades[j].hidden;					
					}
				}
            }
			
			for (var i = 0; i < Game.shares.length; i++) {
				for(var j = 0; j < save.shares.length; j++) {
					if(Game.shares[i].id == save.shares[j].id) {
						Game.shares[i].price = save.shares[j].price;
						Game.shares[i].lastPrice = save.shares[j].lastPrice;
						Game.shares[i].owned = save.shares[j].owned;
						Game.shares[i].invested = save.shares[j].invested;						
					}
				}
            }
			
			for (var i = 0; i < Game.achievements.length; i++) {
				for(var j = 0; j < save.achievements.length; j++) {
					if(Game.achievements[i].id == save.achievements[j].id) {
						Game.achievements[i].unlocked = save.achievements[j].unlocked;					
					}
				}
            }
			
            console.info('Game has been loaded from a save');
        }
		Game.SetOptions();
    }

    Game.Reset = function () {
        if (Game.moneyEarned >= 999999999999) Game.UnlockAchievement('Sacrifice');
        if (Game.moneyEarned >= 999999999999999) Game.UnlockAchievement('Where did it all go?');

        //Game.startTime = new Date();
        //Game.incomeMultiplier = 100 + Math.floor((Math.pow(Game.allMoneyEarned, 1/6)));
		Game.incomeMultiplier = Game.CalculateResetRewardMultiplier();
        Game.moneyEarned = 0;
        Game.money = 25 + Math.floor((Math.pow(Game.allMoneyEarned, 1/4)));
        Game.moneyIncome = 0;
		Game.buildingsAmount = 0;
		Game.upgradesUnlocked = 0;
		Game.buildingsPriceReduction = 0;
		Game.workersPriceReduction = 0;
		Game.upgradesPriceReduction = 0;
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
        Game.ultraBonusProbability = 3;
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
		Game.bank.borrowedMoney = 0;
        Game.bank.loanDebt = 0;
        Game.bank.loanRate = 20;
        Game.bank.loanTime = 60 * 5;
        Game.bank.loanRemainingTime = Game.bank.loanTime;
        Game.lottery.numberRange = 30;
        Game.lottery.poolMultiplier = 1;
		Game.lottery.timesPlayed = 0;
        Game.lottery.timesWon = 0;
        Game.lottery.timesLost = 0;
        Game.lottery.balance = 0;
        Game.lottery.ticketsCost = 0;
        Game.lottery.blockTime = 3;
        Game.lottery.scores = [0, 0, 0, 0, 0];
		Game.stockmarket.balance = 0;
		Game.stockmarket.updateTime = 20;
		Game.stockmarket.remainingTime = Game.stockmarket.updateTime;
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
			Game.upgrades[i].disabled = false;
        }
		
		for (var i = 0; i < Game.shares.length; i++) {
            Game.shares[i].owned = 0;
			Game.shares[i].invested = 0;
        }
		
		for(let i = 0; i < Game.upgradesWithCooldown.length; i++) {
			Game.DisableUpgradeCooldown(Game.upgradesWithCooldown[i]);
		}
		
        Game.MessageBox('Game has been reset', 0);
    }
 
    Game.Draw();//change order with loadsave fix
	Game.LoadSave();
    Game.HandleEvents();
    Game.Loop();
	preload(['res/arrow-down.png', 
			'res/arrow-up.png',
			'res/clock-small.png', 
			'res/close-icon2.png',
			'res/error.png',
			'res/tick.png',
			'res/upgrade-icon.png',
			'res/warning.png',
			'res/medal.png']);
}

/*=================================================
HANDLING EVENTS
==================================================*/

Game.HandleEvents = function () {
	$(window).on('keyup keydown', function(e){
			Game.shiftKey = e.shiftKey;
			Game.ctrlKey = e.ctrlKey;
		}
	);
	
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
		//BONUS
		
		if (Game.bonus && Game.bonusTimeRemaining > 0) Game.bonusTimeRemaining--;
		if (Game.bonus && Game.bonusTimeRemaining == 0) {
			Game.bonusTimeRemaining = Game.bonusTime;
			Game.bonus = false;
		}
		
		//BANK
		
        if (Game.bank.storedMoney > 0 && Game.bank.remainingTime > 0) { 
			Game.bank.remainingTime--
		}
		if(Game.bank.remainingTime == 0) {
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
		
		//LOANS
		
		if (Math.floor(Game.bank.loanDebt) > 0 && Game.bank.loanRemainingTime > 0) { 
			Game.bank.loanRemainingTime--;
		}
		if(Game.bank.loanRemainingTime == 0) {
			var money = Game.bank.borrowedMoney * 0.25;
			Game.bank.payback(money);
			Game.bank.loanRemainingTime = Game.bank.loanTime;
		}
		
		//STOCKMARKET
		
		if (Game.stockmarket.remainingTime > 1) {
			Game.stockmarket.remainingTime--;
		}
		else {
			for (var i = 0; i < Game.shares.length; i++) {
				var rand = getRandom(0, 1);
				var change = getRandomFloat(Game.shares[i].minChangePercent, Game.shares[i].maxChangePercent);
				var increase = rand == 0 ? true : false;
				if (increase) {
					Game.shares[i].lastPrice = Game.shares[i].price;
					Game.shares[i].price = Game.shares[i].price * (100 + change) / 100 > Game.shares[i].maxPrice ? Game.shares[i].maxPrice : Game.shares[i].price * (100 + change) / 100; //math.floor??
				}
				else {
					Game.shares[i].lastPrice = Game.shares[i].price;
					Game.shares[i].price = Game.shares[i].price * (100 - change) / 100 < Game.shares[i].minPrice ? Game.shares[i].minPrice : Game.shares[i].price * (100 - change) / 100;
				}
			}
			Game.stockmarket.remainingTime = Game.stockmarket.updateTime;
		}
		
		//UPGRADES COOLDOWN
		
		for(var i = 0; i < Game.upgradesWithCooldown.length; i++) {
			var upgrade = Game.GetUpgrade(Game.upgradesWithCooldown[i]);
			if(upgrade.cooldownOn) {
				if(upgrade.cooldownRemaining > 1) 
					upgrade.cooldownRemaining--;
				else {
					upgrade.cooldownRemaining = upgrade.cooldown;
					upgrade.cooldownOn = false;
					upgrade.disabled = false;
					if(upgrade.onCooldown !== undefined ) upgrade.onCooldown();
				}
			}
		}
    }, 1000);

    function autoSave() {
        if (Game.options.autoSave) Game.WriteSave(false, true);
        setTimeout(autoSave, Game.options.autoSaveTime * 1000);
    }
    autoSave();

	function bonus() {
		if (!Game.bonus) {
            Game.bonus = true;
            Game.bonusCount++;
            Game.bonusInterval = getRandom(Game.bonusMinTime, Game.bonusMaxTime);
            var rand = getRandom(1, 100);
            var ultraBonus = rand > (100 - Game.ultraBonusProbability) ? true : false;
            if (ultraBonus) {
                Game.ultraBonus = true;
                Game.ultraBonusCount++;
            }
            else {
                Game.ultraBonus = false;
            }
        }
		setTimeout(bonus, (Game.bonusInterval + Game.bonusTime) * 1000);
	}
	setTimeout(bonus, Game.bonusInterval * 1000);
	
    $('.upgrade-building').each(function (i) {
        $(this).on('click', function () {
			Game.buildings[i].tier = Game.CalculateTier(Game.buildings[i].cumulativeGains);
        });
    }
    );

    $('.buy-building').each(function (i) {
        $(this).on('click', function () {
            Game.buy(Game.buildings[i]);
        });
    }
    );

    $('.buy-max-buildings').each(function (i) {
        $(this).on('click', function () {
            Game.buyMax(Game.buildings[i]);
        });
    }
    );

    $('.sell-building').each(function (i) {
        $(this).on('click', function () {
            Game.sell(Game.buildings[i]);
        });
    }
    );

    $('.sell-all-buildings').each(function (i) {
        $(this).on('click', function () {
            Game.sellAll(Game.buildings[i]);
        });
    }
    );

    $('.upgrade').each(function (i) {
        $(this).on('click', function () {
            if (Game.upgrades[i].price > Game.money && !Game.upgrades[i].disabled) {
                Game.MessageBox('You don\'t have enough money', 2);
            }
            else if (Game.upgrades[i].multiple && !Game.upgrades[i].disabled) {
                Game.Spend(Game.upgrades[i].price);
                if(Game.upgrades[i].effect !== undefined) Game.upgrades[i].effect();
				if(Game.upgrades[i].cooldown !== undefined) {
					Game.upgrades[i].cooldownOn = true;
					Game.upgrades[i].disabled = true;
				}
				if(Game.upgrades[i].used == 0)Game.upgradesUnlocked++;
				Game.upgrades[i].used++;
                Game.spentOnUpgrades += Game.upgrades[i].price;
            }
            else if (!Game.upgrades[i].unlocked && !Game.upgrades[i].multiple && !Game.upgrades[i].disabled) {
                Game.Spend(Game.upgrades[i].price);
                if(Game.upgrades[i].effect !== undefined) Game.upgrades[i].effect();
                Game.upgrades[i].unlocked = true;
				Game.upgradesUnlocked++;
                Game.spentOnUpgrades += Game.upgrades[i].price;
            }
        });
    }
    );

    $('#stockmarket-table .buy').each(function (i) {
        $(this).on('click', function () {
            Game.buyShare(Game.shares[i]);
        });
    }
    );

    $('#stockmarket-table .buy-all').each(function (i) {
        $(this).on('click', function () {
            Game.buyAllShares(Game.shares[i]);
        });
    }
    );

    $('.closebox').each(function (i) {
        $(this).on('click', function () {
            $(this).parent().fadeOut(175);
        });
    }
    );

    $('#save-game').on('click', function () { Game.WriteSave(); });
    $('#export-game').on('click', function () { Game.ExportSave(); });
    $('#import-game').on('click', function () { Game.ImportSave(); });
    $('#reset').on('click', function () { Game.Reset(); });
    $('#clear-save').on('click', function () {
        localStorage.setItem(Game.name, '');
        location.reload();
    });

    $('#option-fps').on('change', function () {
        if (parseInt($(this).val()) > 0)
        {
            Game.options.fps = parseInt($(this).val());
            Game.fps = Game.options.fps;
        }
    });

    $('#option-autosave').on('change', function () {
        if ($(this).prop('checked'))
            Game.options.autoSave = true;
        else
            Game.options.autoSave = false;
    });

    $('#option-autosave-time').on('change', function () {
        if (parseInt($(this).val()) > 0) Game.options.autoSaveTime = parseInt($(this).val());
    });

    $('#option-numbers').on('change', function () {   
        Game.options.numbers = parseInt($(this).val());
    });

    $('#buy-worker').on('click', function () { Game.buy(Game.workers) });
    $('#buy-max-workers').on('click', function () { Game.buyMax(Game.workers) });
    $('#sell-worker').on('click', function () { Game.sell(Game.workers) });
    $('#sell-all-workers').on('click', function () { Game.sellAll(Game.workers) });
    $('#workers-pay').on('click', function () {
        if (parseInt(getId('workers-salary').value) > 0)
            Game.workers.Pay(Math.floor(parseInt(getId('workers-salary').value) * Game.workers.reqMoney / 100));
    });
	
	$('#workers-salary').on('change click', function() {
		$(this).siblings('.slider-value').html(Beautify(Math.floor(($(this).val() * Game.workers.reqMoney / 100))));
	});

    $('#workers-pay-max').on('click', function () {
		Game.workers.Pay(Game.workers.reqMoney);
    });

    $('#deposit').on('click', function () {
            Game.bank.Deposit(Math.floor(parseInt(getId('bank-input').value) * Game.money / 100));
    });
	
	$('#bank-input').on('change click', function() {
		$(this).siblings('.slider-value').html(Beautify(Math.floor(($(this).val() * Game.money / 100))));
	});
	
    $('#withdraw').on('click', function () {
        Game.bank.Withdraw(Math.floor(parseInt(getId('bank-withdraw-input').value) * Game.bank.storedMoney / 100));
    });
	
	$('#bank-withdraw-input').on('change click', function() {
		$(this).siblings('.slider-value').html(Beautify(Math.floor(($(this).val() * Game.bank.storedMoney / 100))));
	});
	
    $('#deposit-all').on('click', function () { Game.bank.Deposit(Game.money); });
    $('#withdraw-all').on('click', function () { Game.bank.Withdraw(Game.bank.storedMoney); });

    $('#borrow').on('click', function () {
        if (parseInt(getId('loan-amount').value) > 0)
            Game.bank.borrow(Math.floor(parseInt(getId('loan-amount').value) * Game.bank.maxLoan / 100));
    });
	
	$('#loan-amount').on('change click', function() {
		$(this).siblings('.slider-value').html(Beautify(Math.floor(($(this).val() * Game.bank.maxLoan / 100))));
	});

    $('#borrow-max').on('click', function () {
            Game.bank.borrow(Game.bank.maxLoan - Game.bank.loanDebt);
    });

    $('#payback').on('click', function () {
        if (parseInt(getId('payback-amount').value) > 0)
            Game.bank.payback(Math.floor(parseInt(getId('payback-amount').value) * Game.bank.loanDebt / 100));
    });
	
	$('#payback-amount').on('change click', function() {
		$(this).siblings('.slider-value').html(Beautify(Math.floor(($(this).val() * Game.bank.loanDebt / 100))));
	});


    $('#payback-all').on('click', function () {
            Game.bank.payback(Game.bank.loanDebt);
    });
	
	$('#lottery-custom-price-input').on('change', function() {
		if(parseFloat($(this).val()) > 0) Game.options.lotteryCustomTicketPrice = parseFloat($(this).val());
	});
	
	$('#lottery-max-custom-price').on('click', function () {
        $('#lottery-custom-price-input').val(Math.floor(Game.money));
    });
	
	$('#lottery input[name=lottery-ticket-price]').on('change', function() {
		Game.options.lotteryRegularTicket = $('#lottery-regular-price').prop('checked');
	});
	
	$('.lottery-number').on('change', function() {
		var arr = [];
		$('.lottery-number').each(function() {
			if(parseInt($(this).val()) > 0) arr.push(parseInt($(this).val()));
		});
		if (arr.length == 5) Game.options.lotteryNumbers = arr;
	});
	
    $('#play-lottery').on('click', function () {
        var numbers = [];
        $('.lottery-number').each(function () {
            numbers.push(parseInt($(this).val()));
        });    
		var regular = false;
        var empty = false;
		var notInRange = false;
		var repeated = false;

        $('.lottery-number').each(function () {
            if ($(this).val() == '') {
                empty = true;
            }
			if ($(this).val() > Game.lottery.numberRange || $(this).val() < 1) {
                notInRange = true;
            }
			//return false;
        });
		
		for (var i = 0; i < numbers.length; i++) {
            for (var j = 0; j < i; j++) {
                if (numbers[j] == numbers[i]) {
                    repeated = true;
                    break;
                }
            }
        }
		
		if(!Game.lottery.pool > 0) {
			Game.MessageBox('No money in the lottery pool', 2);
		}
        else if (empty) {
            Game.MessageBox('You left at least one number empty', 2);
        }
		else if (notInRange) {
            Game.MessageBox('One or more numbers isn\'t in the number range', 2);
        }
        else if (repeated) {
            Game.MessageBox('Provided numbers can\'t be repeating', 2);
        }
        else if (Game.lottery.blocked) {
            Game.MessageBox('You have to wait ' + Game.lottery.blockTime + (Game.lottery.blockTime == 1 ? ' second' : ' seconds') + ' to play again', 2);
        }
        else if ($('#lottery-regular-price').prop('checked') && Game.lottery.ticket > 0) {
			if (Game.money < Game.lottery.ticket) Game.MessageBox('You don\'t have enough money', 2);
			else {
				regular = true;
				Game.Spend(Game.lottery.ticket);
				Game.lottery.ticketsCost += Game.lottery.ticket;
				Game.StartLottery(numbers, regular);
			}
		}
		else if(parseFloat($('#lottery-custom-price-input').val()) > 0){
			if (Game.money < parseFloat($('#lottery-custom-price-input').val())) Game.MessageBox('You don\'t have enough money', 2);
			else {
				Game.Spend(parseFloat($('#lottery-custom-price-input').val()));
				Game.lottery.ticketsCost += parseFloat($('#lottery-custom-price-input').val());
				Game.StartLottery(numbers, regular);
			}
		}
        
    });

    console.info('Events initialized');
}

/*=================================================
DRAWING
==================================================*/

Game.UIUpdate = function () {

    //UPPER BAR - NEED TO FIX THIS
    var money = getId('money-text');
    money.innerHTML = "$" + Beautify(Game.money, 0);
    if (Game.money < 0) money.style.color = '#ff3333';
    else
        money.style.color = 'initial';

    var income = getId('income-text');
    income.innerHTML = "$" + Beautify(Game.moneyIncome, 0) + (Game.bonus ? ' (x' + (Game.ultraBonus ? Beautify(Game.ultraBonusMultiplier) : Game.bonusMultiplier) + ') (' + timeStamp(Game.bonusTimeRemaining) +')' : '');
    if (Game.bonus) {
        income.className = 'bonus-active';
    }
    else {
        income.className = '';
    }

    getId('tax').innerHTML = 'Tax rate: ' + Game.tax + '%';

    //BUILDINGS
    if (getId('mining').style.display == 'block') {
        for (var i = 0; i < Game.buildings.length; i++) {
            if (Game.tick % (Game.fps * 1) == 0) {
                Game.updateTooltip('buy-max-buildings' + (i + 1), 'It\'ll buy <strong>' + Game.buyMax(Game.buildings[i], true) + '</strong> units of ' + Game.buildings[i].name);
                Game.updateTooltip('sell-all-buildings' + (i + 1), 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.buildings[i], true)) + '</strong> back ');
            }
            getId('building-amount'.concat(i + 1)).innerHTML = 'Owned: ' + Game.buildings[i].amount;
            getId('building-tier'.concat(i + 1)).innerHTML = 'Tier: ' + Game.buildings[i].tier;
            if (Game.buildings[i].tier < Game.CalculateTier(Game.buildings[i].cumulativeGains)) {
                getId('upgrade-building'.concat(i + 1)).style.display = 'block';
				if(Game.CalculateTier(Game.buildings[i].cumulativeGains) - Game.buildings[i].tier >= 2) 
					getId('upgrade-building'.concat(i + 1)).innerHTML = 'Upgrade Max';
				else
					getId('upgrade-building'.concat(i + 1)).innerHTML = 'Upgrade';
            }
            else {
                getId('upgrade-building'.concat(i + 1)).style.display = 'none';
            }
            var price = getId('building-price'.concat(i + 1));
            price.innerHTML = Beautify(Game.buildings[i].price);
            if (Game.money < Game.buildings[i].price) price.style.color = '#ff3333';
            else
                price.style.color = 'initial';
        }
    }

    //WORKERS
    if (getId('workers').style.display == 'block') {
        getId('workers-amount').innerHTML = 'Amount: ' + Game.workers.amount;
        getId('workers-price').innerHTML = 'Price: $' + Beautify(Game.workers.price, 0);
        getId('workers-req-money').innerHTML = 'Money needed to ' + Game.workers.maxEfficiency + '% efficiency: <strong>$' + Beautify(Game.workers.reqMoney) + '</strong>';
        getId('workers-salary-paid').innerHTML = 'Salary paid: <strong>$' + Beautify(Game.workers.salaryPaid) + '</strong>';
        getId('workers-efficiency').innerHTML = 'Workers efficiency: <strong>' + Game.workers.efficiency + '%</strong>';

        if (Game.tick % (Game.fps * 1) == 0) {
            Game.updateTooltip('buy-max-workers', 'It\'ll hire <strong>' + Game.buyMax(Game.workers, true) + '</strong> workers');
            Game.updateTooltip('sell-all-workers', 'You\'ll get <strong class="money-bg">' + Beautify(Game.sellAll(Game.workers, true)) + '</strong> back ');
        }
    }

    //UPGRADES
    if (getId('upgrades').style.display == 'block') {
        if (Game.tick % (Game.fps * 1) == 0) getId('upgradesUnlocked').innerHTML = 'Upgrades unlocked: ' + Game.upgradesUnlocked + '/' + Game.upgrades.length + ' (' + Math.round(Game.upgradesUnlocked / Game.upgrades.length * 100) + '%)';

        for (var i = 0; i < Game.upgrades.length; i++) {
			var upgrade = getId('upgrade'.concat(i + 1)); //fix
            if (Game.upgrades[i].price > Game.money && !Game.upgrades[i].unlocked) upgrade.style.backgroundColor = '#f96363' //'#FF3333'; //red
            if (Game.upgrades[i].price <= Game.money && !Game.upgrades[i].unlocked) upgrade.style.backgroundColor = '#ccc';
            if (Game.upgrades[i].unlocked == true) upgrade.style.backgroundColor = '#8ff268'; //green
            if (Game.upgrades[i].used >= 1) upgrade.style.backgroundColor = '#8ff268'; //green
            if (Game.upgrades[i].disabled) {
                upgrade.style.opacity = 0.5;
                upgrade.className = 'upgrade';
            }
            else {
                upgrade.style.opacity = 1;
                upgrade.className = 'upgrade active-upgrade';
            }
            if (Game.upgrades[i].hidden) {
                upgrade.style.display = 'none';
            }
            else {
                upgrade.style.display = 'block';
            }
			if(Game.upgrades[i].cooldownOn) upgrade.innerHTML = '<div>' + timeStamp(Game.upgrades[i].cooldownRemaining) + '</div>';
			else
				upgrade.innerHTML = '';
            if (Game.tick % (Game.fps * 1) == 0) Game.updateTooltip('upgrade' + (i + 1), '<div>' + Game.upgrades[i].name + (Game.upgrades[i].multiple ? ' <strong>Multiple use (used ' + Game.upgrades[i].used + (Game.upgrades[i].used == 1 ? ' time' : ' times') + ')</strong>' : '') + '</div><div>' + Game.upgrades[i].desc + '</div><div class="money-bg"><strong>' + Beautify(Game.upgrades[i].price) + '<div>');
        }
    }

    //BANK
    if (getId('bank').style.display == 'block') {
        if (Game.tick % (Game.fps * 0.5) == 0 || getId('bank').getAttribute('loaded') == null ) {
            getId('bank-stored-money').innerHTML = 'Stored money: <strong>$' + Beautify(Game.bank.storedMoney) + '</strong>';
            getId('bank-money-rate').innerHTML = 'Interest rate: <strong>' + Beautify(Game.bank.moneyRate) + '%</strong>';
            getId('bank-money-increase').innerHTML = 'Time until money increase: <strong class="clock-bg">' + timeStamp(Game.bank.remainingTime) + '</strong>';
            getId('bank-cap').innerHTML = 'Bank cap: <strong>' + Beautify(Game.bank.moneyCap) + '%';

            getId('loan-debt').innerHTML = 'Loan debt: <strong>$' + Beautify(Game.bank.loanDebt);
            getId('loan-rate').innerHTML = 'Loan rate: <strong>' + Game.bank.loanRate + '%';
            getId('max-loan').innerHTML = 'Max loan: <strong>$' + Beautify(Game.bank.maxLoan);
            getId('loan-remaining-time').innerHTML = 'Time until loan payback: <strong class="clock-bg">' + timeStamp(Game.bank.loanRemainingTime) + '</strong>';
        }
		if (getId('bank').getAttribute('loaded') == null ) getId('bank').setAttribute('loaded', ''); 
    }

    //LOTTERY
    if (getId('lottery').style.display == 'block') {
        getId('lottery-info').innerHTML = 'Enter <strong>5</strong> numbers ranging from <strong>1</strong> to <strong>' + Game.lottery.numberRange + '</strong>';
        getId('lottery-pool').innerHTML = 'Lottery pool: <strong>$' + Beautify(Game.lottery.pool) + '</strong>';
        getId('ticket-price').innerHTML = '<strong>$' + Beautify(Game.lottery.ticket) + '</strong>'; //zrobic co 1 sec i nizej
		if(getId('lottery-custom-price-input').value > 0 && Game.lottery.ticket > 0)
			getId('lottery-custom-price-percentage').innerHTML = ' (' + Beautify(Math.round(getId('lottery-custom-price-input').value / Game.lottery.ticket * 100)) + '% of the regular price)';
    }

    //STOCK MARKET
    if (getId('stockmarket').style.display == 'block') {
        if (Game.tick % (Game.fps * 1) == 0) {
			getId('stockmarket-remaining-time').innerHTML = 'Time until stock market update: <strong class="clock-bg">' + timeStamp(Game.stockmarket.remainingTime) + '</strong>';
            $('#stockmarket-table .share').each(function (i) {
                $(this).children('.name').html(Game.shares[i].companyName);
                $(this).children('.price').html('$' + Beautify(Game.shares[i].price));
                $(this).children('.change').html(Game.CalculateSharePriceChange(Game.shares[i]) + '%').attr('class', Game.CalculateSharePriceChange(Game.shares[i]) > 0 ? 'change increase-bg' : 'change decrease-bg');
            });

            var shares = Game.GetMyShares();
            var table = $(document.createElement('table'));
            table.addClass('stockmarket-table');

            if (shares.length > 0) {
                table.append('<thead><th>Company name</th><th>Current Price</th><th>Change</th><th>Owned</th><th>Money invested</th><th>Profit</th><th>Sell</th><th>Sell all</th></thead>');
                $.each(Game.GetMyShares(), function (i) {
                    table.append('<tr><td data-label="Name">' + shares[i].companyName + '</td>' +
                        '<td data-label="Current Price">$' + Beautify(shares[i].price) + '</td>' +
                        '<td data-label="Change" class=' + (Game.CalculateSharePriceChange(shares[i]) > 0 ? 'increase-bg' : 'decrease-bg') + '>' + Game.CalculateSharePriceChange(shares[i]) + '%</td>' +
                        '<td data-label="Owned">' + Beautify(shares[i].owned) + '</td>' +
                        '<td data-label="Money invested">$' + Beautify(shares[i].invested) + '</td>' +
                        '<td data-label="Profit" class=' + (shares[i].owned * shares[i].price - shares[i].invested > 0 ? 'increase-bg' : 'decrease-bg') +'>$' + Beautify(shares[i].owned * shares[i].price - shares[i].invested) + ' (' + Game.CalculateShareProfitPercentage(shares[i]) + '%)</td>' +
                        //'<td class=' + (Game.CalculateShareProfitPercentage(shares[i]) > 0 ? 'increase-bg' : 'decrease-bg') +'>' + Game.CalculateShareProfitPercentage(shares[i]) + '%</td>' +
                        '<td data-label="Sell"><button class="sell" data-id=' + shares[i].id + '>Sell</button></td>' +
                        '<td data-label="Sell All"> <button class="sell-all" data-id=' + shares[i].id + '>Sell all</button></td></tr>');
                });

                table.find('.sell').each(function (i) {
                    $(this).on('click', function () {
                        Game.sellShare(Game.GetShareById($(this).attr('data-id')));
                    });
                });

                table.find('.sell-all').each(function (i) {
                    $(this).on('click', function () {
                        Game.sellAllShares(Game.GetShareById($(this).attr('data-id')));
                    });
                });

                $('#stockmarket-myshares-div').html(table);
            } else {
                $('#stockmarket-myshares-div').html('<div>None</div>');
            }
        }
    }

    //STATISTICS
    if (getId('statistics').style.display == 'block') {
        var statistics = $('.trValue');

        statistics[0].innerHTML = Game.playingTime.days + (Game.playingTime.days == 1 ? ' day, ' : ' days, ') + Game.playingTime.hours + (Game.playingTime.hours == 1 ? ' hour and ' : ' hours and ') + Game.playingTime.minutes + (Game.playingTime.minutes == 1 ? ' minute' : ' minutes');
        statistics[1].innerHTML = '$' + Beautify(Game.allMoneyEarned);
        statistics[2].innerHTML = '$' + Beautify(Game.moneyEarned);
        statistics[3].innerHTML = '$' + Beautify(Game.moneyIncome * 60);
        statistics[4].innerHTML = '$' + Beautify(Game.moneyIncome * 3600);
        statistics[5].innerHTML = Beautify(Game.incomeMultiplier) + '%';
        statistics[6].innerHTML = Game.resetCount;
		statistics[7].innerHTML = '$' + Beautify(Game.moneySpentOnTax);
        statistics[8].innerHTML = '$' + Beautify(Game.spentOnUpgrades);
		statistics[9].innerHTML = '$' + Beautify(Game.workers.salaryPaid);
		statistics[10].innerHTML = Beautify(Game.buildingsAmount);
        statistics[11].innerHTML = Game.bonusCount;
		statistics[12].innerHTML = Game.ultraBonusCount;
        statistics[13].innerHTML = '$' + Beautify(Game.bank.difference);
        statistics[14].innerHTML = Beautify(Game.bank.moneyCap) + '%';
        statistics[15].innerHTML = Beautify(Game.lottery.timesWon);
        statistics[16].innerHTML = Beautify(Game.lottery.timesLost);
        statistics[17].innerHTML = Game.lottery.ratio.toFixed(0) + '%';
        statistics[18].innerHTML = '$' + Beautify(Game.lottery.balance);
        statistics[19].innerHTML = '$' + Beautify(Game.lottery.ticketsCost);

        for (var i = 0; i < Game.lottery.scores.length; i++) {
            statistics[20 + i].innerHTML = Game.lottery.scores[i] + ' (' + (Game.lottery.timesWon > 0 ? Math.round(Game.lottery.scores[i] / Game.lottery.timesWon * 10000) / 100 : 0) + '%)';
        }

        statistics[25].innerHTML = '$' + Beautify(Game.workers.cumulativeIncome);

        var counter = 26;

        for (var i = 0; i < Game.buildings.length; i++) {
            statistics[counter].innerHTML = '$' + Beautify(Game.buildings[i].cumulativeIncome);
            counter++;
        }
		
		statistics[counter].innerHTML = '$' + Beautify(Game.workers.cumulativeGains);
		counter++;
		
		for (var i = 0; i < Game.buildings.length; i++) {
            statistics[counter].innerHTML = '$' + Beautify(Game.buildings[i].cumulativeGains);
            counter++;
        }
		
		statistics[counter].innerHTML = '$' + Beautify(Game.cumulativeGains);
    }

    //ACHIEVEMENTS
    if (getId('achievements').style.display == 'block') {
        if (Game.tick % (Game.fps * 1) == 0 || getId('achievements').getAttribute('loaded') == null) {
			getId('achievementsInfo').innerHTML = Game.achievementsUnlocked > 0 ? 'All achievements earned during gameplay: ' : 'No achievements unlocked so far';
			getId('achievementsUnlocked').innerHTML = 'Achievements unlocked: ' + Game.achievementsUnlocked + '/' + Game.achievements.length + ' (' + Math.round(Game.achievementsUnlocked / Game.achievements.length * 100) + '%)';

			for (var i = 0; i < Game.achievements.length; i++) {
				if (Game.achievements[i].unlocked) getId('achievement'.concat(i + 1)).style.display = 'block';
				else
					getId('achievement'.concat(i + 1)).style.display = 'none';

					Game.updateTooltip('achievement' + (i + 1), '<div>' + Game.achievements[i].name + '</div><div>' + Game.achievements[i].desc + '</div>');
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
					Game.achievements[22].desc = 'Save <strong>$' + Beautify(100000000000) + '</strong> in bank';
					Game.achievements[23].desc = 'Save <strong>$' + Beautify(100000000000000) + '</strong> in bank';
					Game.achievements[24].desc = 'Save <strong>$' + Beautify(100000000000000000) + '</strong> in bank';
					Game.achievements[29].desc = '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999) + '</strong> money earned';
					Game.achievements[30].desc = '<strong>Reset</strong> game with over <strong>$' + Beautify(999999999999999) + '</strong> money earned';
			}
		}
		if (getId('achievements').getAttribute('loaded') == null ) getId('achievements').setAttribute('loaded', ''); 
    }
	
	//OPTIONS
	if (getId('options').style.display == 'block') {
        if (Game.tick % (Game.fps * 1) == 0 || getId('options').getAttribute('loaded') == null) {
			Game.updateTooltip('reset', '<div>Resets all your progress but the achievements unlocked.</div><div>After resetting you\'ll get <strong>' + Beautify(Game.CalculateResetRewardMultiplier()) + '%</strong> income multiplier and <strong class="money-bg">' + Beautify(25 + Math.floor((Math.pow(Game.allMoneyEarned, 1/4)))) + '</strong> in cash</div>');
		}
		if (getId('options').getAttribute('loaded') == null ) getId('options').setAttribute('loaded', ''); 
    }

    //Game.options.fps = ('option-fps').value;

    Game.tick++;
}

/*=================================================
LOGIC
==================================================*/

Game.Logic = function () {
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

    for (var i = 0; i < Game.buildings.length; i++) {
        Game.buildings[i].price = Game.addTax(subtractPercent(Math.pow(1.15, Game.buildings[i].amount) * Game.buildings[i].basePrice, Game.buildingsPriceReduction));
        Game.buildings[i].income = Game.subtractTax(Math.pow(1.05, Game.buildings[i].amount) * Game.buildings[i].baseIncome * Math.pow(1.035, Game.buildings[i].tier));
    }

    //LOTTERY

    Game.lottery.ratio = Game.lottery.timesPlayed == 0 ? 0 : (Game.lottery.timesWon / (Game.lottery.timesPlayed) * 100);
    Game.lottery.pool = (1 + (Game.bonusMultiplier / 100)) * Game.lottery.poolMultiplier * (Game.rawIncome * 500000) + (Game.moneyEarned / 100) + (Game.bank.difference / 20) + (Game.lottery.balance / 20);
    Game.lottery.ticket = 0.0003 * Game.lottery.pool / 100;

    //UPGRADES PRICING
    for (var i = 0; i < Game.upgrades.length; i++) {
		switch (Game.upgrades[i].name) {
			case 'Restoration': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.20, Game.upgrades[i].used), Game.upgradesPriceReduction)); break;
			case 'Use the whip': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.20, Game.upgrades[i].used), Game.upgradesPriceReduction)); break;
			case 'Tax Be Gone': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.25, Game.upgrades[i].used), Game.upgradesPriceReduction)); break;
			case 'Mysterious upgrade': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.05, Game.upgrades[i].used), Game.upgradesPriceReduction)); break;
			case 'Bonus on demand': Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice * Math.pow(1.15, Game.upgrades[i].used), Game.upgradesPriceReduction)); break;
			default: Game.upgrades[i].price = Game.addTax(subtractPercent(Game.upgrades[i].basePrice, Game.upgradesPriceReduction));break;
		}
    }

    if (Game.bonus && !Game.GetUpgrade('Bonus on demand').hidden) Game.GetUpgrade('Bonus on demand').disabled = true;
    else
        Game.GetUpgrade('Bonus on demand').disabled = false;

    document.title = '$' + Beautify(Game.money) + (Game.bonus ? (Game.ultraBonus ? ' (UB)' : ' (B)') : '');

    var cumulativeGains = 0;
    for (var i = 0; i < Game.buildings.length; i++) {
        Game.buildings[i].cumulativeGains += Game.buildings[i].cumulativeIncome * (Game.bonus ? (Game.ultraBonus ? Game.ultraBonusMultiplier : Game.bonusMultiplier) : 1) / Game.fps;
        cumulativeGains += Game.buildings[i].cumulativeGains;    
    }
	cumulativeGains += Game.workers.cumulativeGains;
    Game.cumulativeGains = cumulativeGains;

    //WORKERS RELATED

    Game.workers.price = Game.addTax(subtractPercent(Math.pow(1.15, Game.workers.amount) * Game.workers.basePrice, Game.workersPriceReduction));
    Game.workers.income = Game.subtractTax(Math.pow(1.05, Game.workers.amount) * Game.workers.baseIncome * Game.workers.efficiency / 100);
    Game.workers.cumulativeIncome = Game.subtractTax(((Game.workers.baseIncome * Game.workers.efficiency * (Math.pow(1.05, Game.workers.amount) - 1)) / 0.05) / 100 * Game.incomeMultiplier / 100);
    Game.workers.cumulativeGains += Game.workers.cumulativeIncome * (Game.bonus ? (Game.ultraBonus ? Game.ultraBonusMultiplier : Game.bonusMultiplier) : 1) / Game.fps;

    Game.GetMoney(Game.moneyIncome / Game.fps);

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
	if (Game.workers.amount >= 200) Game.UnlockAchievement('Employer #2');
    if (Game.bonusCount >= 100) Game.UnlockAchievement('Booster');
    if (Game.bonusCount >= 1000) Game.UnlockAchievement('Multiplication');
	if (Game.ultraBonusCount >= 1) Game.UnlockAchievement('Finally!');
    if (Game.upgradesUnlocked >= Math.floor(Game.upgrades.length/2)) Game.UnlockAchievement('Halfway');
    if (Game.upgradesUnlocked == Game.upgrades.length) Game.UnlockAchievement('Enhancer');
    if (Game.bank.difference >= 100000000000) Game.UnlockAchievement('Money saver');
    if (Game.bank.difference >= 100000000000000) Game.UnlockAchievement('The wait was worth');
	if (Game.bank.difference >= 100000000000000000) Game.UnlockAchievement('Hoarder');
    if (Game.lottery.timesWon >= 777) Game.UnlockAchievement('Lucky one');
    if (Game.lottery.scores[2] >= 30) Game.UnlockAchievement('Not that bad');
    if (Game.lottery.scores[3] >= 5) Game.UnlockAchievement('Plain lucky');
    if (Game.playingTime.days >= 7) Game.UnlockAchievement('Addicted');

    if (!Game.GetUpgrade('The real hellish upgrade').hidden // ZROBIC TO W ODBLOKOWYWANIU UKRYTYCH UPGRADOW
        || !Game.GetUpgrade('Jackpot').hidden 
		|| !Game.GetUpgrade('Faster than light #7').hidden 
        || !Game.GetUpgrade('Final bonus booster').hidden
        || !Game.GetUpgrade('Eternal bonus').hidden
        || !Game.GetUpgrade('Mysterious upgrade').hidden
        || !Game.GetUpgrade('No limits').hidden
        || !Game.GetUpgrade('Greater chance #4').hidden
        || !Game.GetUpgrade('Bonus on demand').hidden) Game.UnlockAchievement('Searching the unknown');

    //HIDDEN UPGRADES UNLOCKING
    if (Game.Unlocked('Wrecking enhancer #5') && Game.moneyEarned >= 666666666666666666) Game.Unhide('The real hellish upgrade');
	if (Game.ultraBonusCount >= 30) Game.Unhide('Faster than light #7');
    if (Game.lottery.timesWon >= 777) Game.Unhide('Jackpot');
    if (Game.lottery.timesWon >= 2000) Game.Unhide('Greater chance #4');
    if (Game.lottery.timesPlayed >= 1000 && Game.playingTime.days >= 5) Game.Unhide('No limits');
    if (Game.bonusCount >= 1000) Game.Unhide('Final bonus booster');
    if (Game.bonusCount >= 1337 && Game.playingTime.days >= 7) Game.Unhide('Bonus on demand');
    if (Game.bonusCount >= 1500 && Game.Unlocked('Final bonus booster') && Game.moneyEarned >= 666666666666666666) Game.Unhide('Eternal bonus');
    if (Game.moneyEarned >= 1000000000000) Game.Unhide('Mysterious upgrade');

    //WORKERS EFFICIENCY
	Game.workers.pay = Game.workers.cumulativeGains * 0.10;
	var efficiency = Game.GetUpgrade('Use the whip').cooldownOn ?  Game.workers.maxEfficiency : (Math.round(Game.workers.salaryPaid / Game.workers.pay * 100) > 0 ? Math.round(Game.workers.salaryPaid / Game.workers.pay * 100) : 1);
	if (efficiency > Game.workers.maxEfficiency) {
		Game.workers.efficiency = Game.workers.maxEfficiency;
	}
	else {
		Game.workers.efficiency = efficiency;
	}

	if (efficiency < Game.workers.maxEfficiency) Game.workers.reqMoney = Game.workers.pay * (Game.workers.maxEfficiency - efficiency) / 100;
	else
		Game.workers.reqMoney = 0;
	
    Game.bank.maxLoan = (Game.rawIncome * 200000) + (Game.moneyEarned / 13) + (Game.bank.difference / 25) + (Game.lottery.balance / 25);

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
    console.info('Game has been started');
}