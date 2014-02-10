/*=================================================
UTILITY FUNCTIONS
==================================================*/

function getId(id) { return document.getElementById(id); } //Shortcut for the long name function

function AddEvent(html_element, event_name, event_function) { //Creating events with browsers compatibility
    if (html_element.attachEvent) //Internet Explorer compatibility
        html_element.attachEvent("on" + event_name, function () { event_function.call(html_element); });
    else if (html_element.addEventListener) //Firefox 
        html_element.addEventListener(event_name, event_function, false);
}

function Beautify(what, floats)//Turns 9999999 into 9,999,999
{
    var str = '';
    if (!isFinite(what)) return 'Infinity';
    if (what.toString().indexOf('e') != -1) return what.toString();
    what = Math.round(what * 10000000) / 10000000;
    if (floats > 0) {
        var floater = what - Math.floor(what);
        floater = Math.round(floater * 10000000) / 10000000;
        var floatPresent = floater ? 1 : 0;
        floater = (floater.toString() + '0000000').slice(2, 2 + floats);
        if (parseInt(floater) === 0) floatPresent = 0;
        str = Beautify(Math.floor(what)) + (floatPresent ? ('.' + floater) : '');
    }
    else {
        what = Math.floor(what);
        what = (what + '').split('').reverse();
        for (var i in what) {
            if (i % 3 == 0 && i > 0) str = ',' + str;
            str = what[i] + str;
        }
    }
    return str;
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/*=================================================
THE GAME
==================================================*/

Game = {};

Game.Init = function () {
    Game.name = 'miner';
    Game.tick = 0;
    Game.fps = 30;
    Game.moneyEarned = 0
    Game.money = 20;
    Game.moneyIncome = 0;
    Game.incomeMultiplier = 100;
    Game.buildingsAmount = 0;
    Game.upgradesUnlocked = 0;

    Game.bonus = false;
    Game.bonusTime = 30;
    Game.bonusTimeRemaining = Game.bonusTime;
    Game.bonusMultiplier = 10;
    Game.bonusCount = 0;

    Game.workers = {};
    Game.workers.amount = 0;
    Game.workers.baseIncome = 7;
    Game.workers.income = 7;
    Game.workers.cumulativeIncome = 0;
    Game.workers.cumulativeGains = 0;
    Game.workers.basePrice = 50;
    Game.workers.price = 50;
    Game.workers.salary = 0;
    Game.workers.paymentTime = 20;
    Game.workers.remainingTime = Game.workers.paymentTime;
    Game.workers.salaryPaid = 0;

    Game.bank = {};
    Game.bank.storedMoney = 0;
    Game.bank.moneyRate = 2;

    //WORKERS RELATED

    Game.workers.Buy = function () {
        if (this.price > Game.money) {
            alert('Nie masz wystarczajaco pieniedzy');
        }
        else {
            Game.Spend(this.price);
            this.amount++;
        }
    }

    Game.workers.Sell = function () {
        if (this.amount <= 0) {
            alert('Nie mozesz juz wiecej sprzedac robotnikow');
        }
        else {
            Game.GetMoney(this.price);
            this.amount--;
        }
    }

    Game.workers.Pay = function () {
        if (Game.workers.salary >= Game.money) {
            Game.money = 0;
            this.salaryPaid += this.salary - Game.money;
        }
        else {
            Game.money -= this.salary;
            this.salaryPaid += this.salary;
        }
        console.log('You have paid ' + Game.workers.salary);
    }

    //BANK RELATED
    Game.bank.Deposit = function (amount) {
        if (amount > Game.money) {
            alert('Nie masz wystarczajaco pieniedzy');
        }
        else {
            this.storedMoney += amount;
            Game.Spend(amount);
        }
    }

    Game.bank.Withdraw = function (amount) {
        if (amount > this.storedMoney) {
            alert('Nie masz tylu pieniedzy w banku');
        }
        else {
            this.storedMoney -= amount;
            Game.GetMoney(amount);
        }
    }

    Game.GetMoney = function (howmuch) {
        Game.money += howmuch;
        Game.moneyEarned += howmuch;
    }

    Game.Spend = function (howmuch) {
        Game.money -= howmuch;
    }

    //CONTENT

    Game.Building = function (name, basePrice, baseIncome) {
        this.name = name;
        this.basePrice = basePrice;
        this.price = this.basePrice;
        this.baseIncome = baseIncome;
        this.income = this.baseIncome;
        this.amount = 0;
        this.cumulativeIncome = 0;
        this.cumulativeGains = 0;
    }

    Game.Upgrade = function (name, desc, price, effect) {
        this.name = name;
        this.desc = desc;
        this.unlocked = false;
        this.price = price;
        this.used = false;
        this.effect = effect;
    }

    Game.Achievement = function (name, desc) {
        this.name = name;
        this.desc = desc;
        this.unlocked = false;
    }

    Game.buildings = [];
    Game.buildings.push(new Game.Building('Łopata', 20, 1));
    Game.buildings.push(new Game.Building('Kopalnia', 50, 3));
    Game.buildings.push(new Game.Building('Ulepszona kopalnia', 100, 5));

    Game.upgrades = [];
    Game.upgrades.push(new Game.Upgrade('Simple Enhancer #1', 'Increases the income multiplier by <b>10%</b>', 10000,
            function () {
                Game.incomeMultiplier += 10;
            }));

    Game.upgrades.push(new Game.Upgrade('Simple Enhancer #2', 'Increases the income multiplier by <b>10%</b>', 50000,
            function () {
                Game.incomeMultiplier += 10;
            }));

    Game.upgrades.push(new Game.Upgrade('Simple Enhancer #3', 'Increases the income multiplier by <b>10%</b>', 100000,
            function () {
                Game.incomeMultiplier += 10;
            }));

    Game.upgrades.push(new Game.Upgrade('Booster #1', 'Increases the income multiplier by <b>20%</b>', 300000,
            function () {
                Game.incomeMultiplier += 20;
            }));

    Game.upgrades.push(new Game.Upgrade('Booster #2', 'Increases the income multiplier by <b>20%</b>', 500000,
            function () {
                Game.incomeMultiplier += 20;
            }));

    Game.upgrades.push(new Game.Upgrade('Booster #3', 'Increases the income multiplier by <b>20%</b>', 1000000,
            function () {
                Game.incomeMultiplier += 20;
            }));

    Game.upgrades.push(new Game.Upgrade('Augmented booster #1', 'Increases the income multiplier by <b>30%</b>', 5000000,
            function () {
                Game.incomeMultiplier += 30;
            }));

    Game.upgrades.push(new Game.Upgrade('Augmented booster #2', 'Increases the income multiplier by <b>30%</b>', 25000000, 
            function () {
                Game.incomeMultiplier += 30;
            }));

    Game.upgrades.push(new Game.Upgrade('Augmented booster #3', 'Increases the income multiplier by <b>30%</b>', 50000000, 
            function () {
                Game.incomeMultiplier += 30;
            }));

    Game.upgrades.push(new Game.Upgrade('Superior booster #1', 'Increases the income multiplier by <b>40%</b>', 100000000, 
            function () {
                Game.incomeMultiplier += 40;
            }));

    Game.upgrades.push(new Game.Upgrade('Superior booster #2', 'Increases the income multiplier by <b>40%</b>', 150000000, 
            function () {
                Game.incomeMultiplier += 40;
            }));

    Game.upgrades.push(new Game.Upgrade('Superior booster #3', 'Increases the income multiplier by <b>40%</b>', 200000000, 
            function () {
                Game.incomeMultiplier += 40;
            }));

    Game.upgrades.push(new Game.Upgrade('Advanced booster #1', 'Increases the income multiplier by <b>45%</b>', 500000000, 
            function () {
                Game.incomeMultiplier += 45;
            }));

    Game.upgrades.push(new Game.Upgrade('Advanced booster #2', 'Increases the income multiplier by <b>45%</b>', 1000000000, 
            function () {
                Game.incomeMultiplier += 45;
            }));

    Game.upgrades.push(new Game.Upgrade('Advanced booster #3', 'Increases the income multiplier by <b>45%</b>', 1500000000,
            function () {
                Game.incomeMultiplier += 45;
            }));

    Game.upgrades.push(new Game.Upgrade('Even more advanced booster #1', 'Increases the income multiplier by <b>50%</b>', 2000000000,
            function () {
                Game.incomeMultiplier += 50;
            }));

    Game.upgrades.push(new Game.Upgrade('Even more advanced booster #2', 'Increases the income multiplier by <b>50%</b>', 5000000000, 
            function () {
                Game.incomeMultiplier += 50;
            }));

    Game.upgrades.push(new Game.Upgrade('Even more advanced booster #3', 'Increases the income multiplier by <b>50%</b>', 10000000000, 
            function () {
                Game.incomeMultiplier += 50;
            }));

    Game.upgrades.push(new Game.Upgrade('Bonus booster', 'Increases the bonus multiplier by <b>3 times</b>', 3000000,
            function () {
                Game.bonusMultiplier *= 3;
            }));

    Game.achievements = [];

    Game.achievements.push(new Game.Achievement('Little business', 'Earn <b>$10,000</b>'));
    Game.achievements.push(new Game.Achievement('Getting serious', 'Earn <b>$100,000</b>'));
    Game.achievements.push(new Game.Achievement('Millionaire', 'Earn <b>$1,000,000</b>'));
    Game.achievements.push(new Game.Achievement('Billionaire', 'Earn <b>$1,000,000,000</b>'));
    Game.achievements.push(new Game.Achievement('Enhancer', 'Get <b>all the upgrades</b>'));
    Game.achievements.push(new Game.Achievement('Big pockets', 'Have <b>$1,000,000</b> on hand'));
    Game.achievements.push(new Game.Achievement('Reset', '<b>Reset</b> game once'));

    /*=================================================
    NEW DRAWING SYSTEM TEST
    ==================================================*/
    Game.Draw = function () {
        Game.CreateButton = function (id, classname, name) {
            var button = document.createElement('a');
            button.id = id;
            button.className = classname;
            button.appendChild(document.createTextNode(name));
            return button;
        }

        //BUILDINGS
        var miningTab = getId('mine');

        for (var i = 0; i < Game.buildings.length; i++) {
            var buildingItem = document.createElement('div');
            buildingItem.id = 'buildingItem' + (i + 1);
            buildingItem.className = 'buildingItem';
            miningTab.appendChild(buildingItem);

            var buildingName = document.createElement('span');
            buildingName.id = 'buildingName' + (i + 1);
            buildingName.className = 'buildingName';
            buildingItem.appendChild(buildingName);

            var buildingPrice = document.createElement('span');
            buildingPrice.id = 'buildingPrice' + (i + 1);
            buildingPrice.className = 'buildingPrice';
            buildingItem.appendChild(buildingPrice);

            var buildingAmount = document.createElement('span');
            buildingAmount.id = 'buildingAmount' + (i + 1);
            buildingAmount.className = 'buildingAmount';
            buildingItem.appendChild(buildingAmount);

            var buyBuilding = document.createElement('div');
            buyBuilding.id = 'buyBuilding' + (i + 1);
            buyBuilding.className = 'buyBuilding';
            buyBuilding.appendChild(document.createTextNode('BUY'));
            buildingItem.appendChild(buyBuilding);

            var sellBuilding = document.createElement('div');
            sellBuilding.id = 'sellBuilding' + (i + 1);
            sellBuilding.className = 'sellBuilding';
            sellBuilding.appendChild(document.createTextNode('SELL'));
            buildingItem.appendChild(sellBuilding);
        }

        //UPGRADES
        var upgradesTab = getId('upgrades');

        var upgradesUnlocked = document.createElement('span')
        upgradesUnlocked.id = 'upgradesUnlocked';
        upgradesTab.appendChild(upgradesUnlocked);

        for (var i = 0; i < Game.upgrades.length; i++) {
            var upgrade = document.createElement('div');
            upgrade.id = 'upgrade' + (i + 1);
            upgrade.className = 'upgrade';
            upgradesTab.appendChild(upgrade);

            var upgradeName = document.createElement('div');
            upgradeName.id = 'upgradeName' + (i + 1);
            upgrade.appendChild(upgradeName);

            var upgradeDesc = document.createElement('div');
            upgradeDesc.id = 'upgradeDesc' + (i + 1);
            upgrade.appendChild(upgradeDesc);

            var upgradePrice = document.createElement('div');
            upgradePrice.id = 'upgradePrice' + (i + 1);
            upgrade.appendChild(upgradePrice);
        }

        //WORKERS

        var workersTab = getId('workers');

        workersTab.appendChild(Game.CreateButton('buyWorker', 'button', 'Buy a worker'));
        workersTab.appendChild(Game.CreateButton('sellWorker', 'button', 'Sell a worker'));
        var workersAmount = document.createElement('div');
        workersAmount.id = 'workersAmount';
        var workersPrice = document.createElement('div');
        workersPrice.id = 'workersPrice';
        var workersIncome = document.createElement('div');
        workersIncome.id = 'workersIncome';
        var workersSalary = document.createElement('div');
        workersSalary.id = 'workersSalary';
        var time = document.createElement('div');
        time.id = 'time';
        workersTab.appendChild(workersAmount);
        workersTab.appendChild(workersPrice);
        workersTab.appendChild(workersIncome);
        workersTab.appendChild(workersSalary);
        workersTab.appendChild(time);

        //BANK

        var bankTab = getId('bank');

        var storedMoney = document.createElement('div');
        storedMoney.id = 'storedMoney';
        var moneyRate = document.createElement('div');
        moneyRate.id = 'moneyRate';
        var bankInput = document.createElement('input');
        bankInput.setAttribute('type', 'text');
        bankInput.id = 'bankInput';

        bankTab.appendChild(storedMoney);
        bankTab.appendChild(moneyRate);
        bankTab.appendChild(bankInput);
        bankTab.appendChild(Game.CreateButton('depositall', 'button', 'Deposit all money'));
        bankTab.appendChild(Game.CreateButton('withdrawall', 'button', 'Withdraw all money'));
        bankTab.appendChild(Game.CreateButton('deposit', 'button', 'Deposit'));
        bankTab.appendChild(Game.CreateButton('withdraw', 'button', 'Withdraw'));


        //STATISTICS

        var statisticsTab = getId('statistics');

        var moneyEarned = document.createElement('div');
        moneyEarned.id = 'moneyEarned';
        moneyEarned.className = 'stat';

        var incomePerMinute = document.createElement('div');
        incomePerMinute.id = 'incomePerMinute';
        incomePerMinute.className = 'stat';

        var incomeMultiplier = document.createElement('div');
        incomeMultiplier.id = 'incomeMultiplier';
        incomeMultiplier.className = 'stat';

        var buildingsOwned = document.createElement('div');
        buildingsOwned.id = 'buildingsOwned';
        buildingsOwned.className = 'stat';

        var salaryPaid = document.createElement('div');
        salaryPaid.id = 'salaryPaid';
        salaryPaid.className = 'stat';

        var workersGains = document.createElement('div');
        workersGains.id = 'workersGains';
        workersGains.className = 'stat';

        statisticsTab.appendChild(moneyEarned);
        statisticsTab.appendChild(incomePerMinute);
        statisticsTab.appendChild(incomeMultiplier);
        statisticsTab.appendChild(buildingsOwned);
        statisticsTab.appendChild(salaryPaid);
        statisticsTab.appendChild(workersGains);

        for (var i = 0; i < Game.buildings.length; i++) {
            var cumulative = document.createElement('div');
            cumulative.id = 'cumulative' + (i + 1);
            cumulative.className = 'stat';
            var cumulativeGains = document.createElement('div');
            cumulativeGains.id = 'cumulativeGains' + (i + 1);
            cumulativeGains.className = 'stat';
            statisticsTab.appendChild(cumulative);
            statisticsTab.appendChild(cumulativeGains);
        }

        //ACHIEVEMENTS

        var achievementsTab = getId('achievements');

        for (var i = 0; i < Game.achievements.length; i++) {
            var achievement = document.createElement('div');
            achievement.id = 'achievement' + (i + 1);
            achievement.className = 'achievement';
            achievement.style.display = 'none';
            achievementsTab.appendChild(achievement);

            var achievementName = document.createElement('div');
            achievementName.id = 'achievementName' + (i + 1);
            achievement.appendChild(achievementName);

            var achievementDesc = document.createElement('div');
            achievementDesc.id = 'achievementDesc' + (i + 1);
            achievement.appendChild(achievementDesc);

        }

        //OPTIONS

        var optionsTab = getId('options');

        optionsTab.appendChild(Game.CreateButton('btnSaveGame', 'button', 'Save Game'));
        optionsTab.appendChild(Game.CreateButton('btnExport', 'button', 'Export Game'));
        optionsTab.appendChild(Game.CreateButton('btnImport', 'button', 'Import Game'));
        optionsTab.appendChild(Game.CreateButton('btnReset', 'button', 'Reset'));
    }

    Game.Draw();

    
    Game.UnlockAchievement = function (achievementName) {
        for (var i = 0; i < Game.achievements.length; i++) {
            if (Game.achievements[i].name == achievementName && !Game.achievements[i].unlocked) {
                Game.achievements[i].unlocked = true;
            }
        }
    }

    Game.WriteSave = function (exporting) {
        var str = '';
        str += Game.moneyEarned + '|';
        str += Game.money + '|';
        str += Game.moneyIncome + '|';
        str += Game.incomeMultiplier + '|';
        str += Game.buildingsAmount + '|';
        str += Game.workers.amount + '|';
        str += Game.workers.salaryPaid + '|';
        str += Game.workers.cumulativeGains + '|';
        str += Game.bonusMultiplier + '|';
        str += Game.bonusCount + '|';

        for (var i = 0; i < Game.buildings.length; i++) {
            str += Game.buildings[i].price + '|';
            str += Game.buildings[i].income + '|';
            str += Game.buildings[i].amount + '|';
            str += Game.buildings[i].cumulativeGains + '|';
        }
        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].unlocked == true) {
                str += '1|';
            }
            else {
                str += '0|';
            }

            if (Game.upgrades[i].used == true)
                str += '1|';
            else
                str += '0|';
        }
        for (var i = 0; i < Game.achievements.length; i++) {
            if (Game.achievements[i].unlocked == true) {
                str += '1|';
            }
            else {
                str += '0|';
            }
        }
        var now = new Date();
        now.setFullYear(now.getFullYear() + 5);
        str = Game.name + '=' + str + '; expires=' + now.toUTCString() + ';';
        document.cookie = str;
        if (exporting) {
            return str;
        }
        console.info('Game has been saved');
    }

    Game.ExportSave = function () {
        prompt('Copy this save: ', Game.WriteSave(true));
    }

    Game.ImportSave = function () {
        var save = prompt("Enter your save: ")
        if (save != '') Game.LoadSave(save);
    }

    Game.LoadSave = function (data) {
        var str = '';
        if (data) {
            str = data.split(Game.name + '=');

        }
        else if (document.cookie.indexOf(Game.name) >= 0) {
            str = document.cookie.split(Game.name + '=');
        }
        if (str != '') {
            var cookie = str[1];
            var save = cookie.split('|');
            Game.moneyEarned = parseInt(save[0]);
            Game.money = parseInt(save[1]);
            Game.moneyIncome = parseInt(save[2]);
            Game.incomeMultiplier = parseInt(save[3]);
            Game.buildingsAmount = parseInt(save[4]);
            Game.workers.amount = parseInt(save[5]);
            Game.workers.salaryPaid = parseInt(save[6]);
            Game.workers.cumulativeGains = parseInt(save[7]);
            Game.bonusMultiplier = parseInt(save[8]);
            Game.bonusCount = parseInt(save[9]);

            var temp = 10;
            var counter = 0;
            for (var i = 0; i < Game.buildings.length; i++) {
                Game.buildings[i].price = parseInt(save[temp + counter]);
                counter++;
                Game.buildings[i].income = parseInt(save[temp + counter]);
                counter++;
                Game.buildings[i].amount = parseInt(save[temp + counter]);
                counter++;
                Game.buildings[i].cumulativeGains = parseInt(save[temp + counter]);
                counter++;
            }

            for (var i = 0; i < Game.upgrades.length; i++) {
                if (save[temp + counter] == '1') {
                    Game.upgrades[i].unlocked = true;
                }
                counter++;
                if (save[temp + counter] == '1') {
                    Game.upgrades[i].used = true;
                }
                counter++;
            }
            for (var i = 0; i < Game.achievements.length; i++) {
                if (save[temp + counter] == '1') {
                    Game.achievements[i].unlocked = true;
                }
                counter++;
            }

            console.info('Game has been loaded from a save');
        }

    }

    Game.Reset = function () {
        Game.UnlockAchievement('Reset');

        Game.moneyEarned = 0;
        Game.money = 20;
        Game.moneyIncome = 0;
        Game.incomeMultiplier = 100;
        Game.buildingsAmount = 0;
        Game.workers.amount = 0;
        Game.workers.salaryPaid = 0;
        Game.workers.cumulativeGains = 0;
        Game.bonusMultiplier = 10;
        Game.bonusCount = 0;

        for (var i = 0; i < Game.buildings.length; i++) {
            Game.buildings[i].price = Game.buildings[i].basePrice;
            Game.buildings[i].income = Game.buildings[i].baseIncome;
            Game.buildings[i].cumulativeGains = 0;
            Game.buildings[i].amount = 0;
        }

        for (var i = 0; i < Game.upgrades.length; i++) {
            Game.upgrades[i].unlocked = false;
            Game.upgrades[i].used = false;
        }

        /*for (var i = 0; i < Game.achievements.length; i++) {
            Game.achievements[i].unlocked = false;
        } Reset wont clear achievements for now*/

    }

    Game.LoadSave();
    Game.HandleEvents();
}

/*=================================================
HANDLING EVENTS
==================================================*/

Game.HandleEvents = function () {
    Game.BuildingsListener = function (i) {
        AddEvent(getId('buyBuilding'.concat(i + 1)), 'click',
            function () {
                if (Game.buildings[i].price > Game.money) {
                    alert('Nie masz wystarczajaco pieniedzy');
                }
                else {
                    Game.Spend(Game.buildings[i].price);
                    Game.buildings[i].amount++;

                }
            }
            );

        AddEvent(getId('sellBuilding'.concat(i + 1)), 'click',
            function () {
                if (Game.buildings[i].amount <= 0) {
                    alert('Nie mozesz juz wiecej sprzedac');
                }
                else {
                    Game.GetMoney(Game.buildings[i].price);
                    Game.buildings[i].amount--;
                }
            }
            );
    }

    Game.UpgradesListener = function (i) {
        AddEvent(getId('upgrade'.concat(i + 1)), 'click',
            function () {
                if (Game.upgrades[i].price > Game.money && !Game.upgrades[i].unlocked) {
                    alert('Nie masz wystarczajaco pieniedzy');
                }
                else if (!Game.upgrades[i].unlocked) {
                    Game.Spend(Game.upgrades[i].price);
                    Game.upgrades[i].unlocked = true;
                }
            }
            );
    }

    for (var i = 0; i < Game.buildings.length; i++) {
        Game.BuildingsListener(i);
    }

    for (var i = 0; i < Game.upgrades.length; i++) {
        Game.UpgradesListener(i);
    }


    AddEvent(getId('btnSaveGame'), 'click', function () { Game.WriteSave(); });
    AddEvent(getId('btnExport'), 'click', function () { Game.ExportSave(); });
    AddEvent(getId('btnImport'), 'click', function () { Game.ImportSave(); });
    AddEvent(getId('btnReset'), 'click', function () { Game.Reset(); });

    AddEvent(getId('buyWorker'), 'click', function () { Game.workers.Buy() });
    AddEvent(getId('sellWorker'), 'click', function () { Game.workers.Sell() });

    AddEvent(getId('deposit'), 'click', function () {
        if (getId('bankInput').value != '')
        Game.bank.Deposit(parseInt(getId('bankInput').value));
    });
    AddEvent(getId('withdraw'), 'click', function () {
        if (getId('bankInput').value != '')
        Game.bank.Withdraw(parseInt(getId('bankInput').value));
    });
    AddEvent(getId('depositall'), 'click', function () { Game.bank.Deposit(Game.money); });
    AddEvent(getId('withdrawall'), 'click', function () { Game.bank.Withdraw(Game.bank.storedMoney); });
}

/*=================================================
DRAWING
==================================================*/

Game.DrawUpdate = function () {

    //UPPER BAR - NEED TO FIX THIS
    var money = getId('money');
    money.innerHTML = "Current money: $" + Beautify(Game.money, 0);
    var income = getId('income');
    income.innerHTML = "Income per second: $" + Beautify(Game.moneyIncome, 0) + (Game.bonus ? ' (x' + Game.bonusMultiplier + ')' : '');

    //BUILDINGS
    for (var i = 0; i < Game.buildings.length; i++) {
        getId('buildingName'.concat(i + 1)).innerHTML = Game.buildings[i].name;
        getId('buildingPrice'.concat(i + 1)).innerHTML = 'Price: $' + Beautify(Game.buildings[i].price, 0);
        getId('buildingAmount'.concat(i + 1)).innerHTML = 'Amount: ' + Game.buildings[i].amount;
    }

    //UPGRADES

    if (getId('gridView').checked) {
        for (var i = 0; i < Game.upgrades.length; i++) {
            getId('upgrade'.concat(i + 1)).style.width = '345px';
            getId('upgrade'.concat(i + 1)).style.cssFloat = 'left';
        }
    }
    else if (getId('listView').checked) {
        for (var i = 0; i < Game.upgrades.length; i++) {
            getId('upgrade'.concat(i + 1)).style.width = 'auto';
            getId('upgrade'.concat(i + 1)).style.cssFloat = 'none';
        }
    }

    getId('upgradesUnlocked').innerHTML = 'Unlocked upgrades: ' + Game.upgradesUnlocked + '/' + Game.upgrades.length + ' (' + Math.round(Game.upgradesUnlocked / Game.upgrades.length * 100) + '%)';

    for (var i = 0; i < Game.upgrades.length; i++) {
        if (Game.money < Game.upgrades[i].price || !Game.upgrades[i].unlocked) getId('upgrade'.concat(i + 1)).style.background = '#FF3333'; //red
        if (Game.upgrades[i].price < Game.money && !Game.upgrades[i].unlocked) {
            //if (Math.floor(Game.tick % 5) == 0)
            getId('upgrade'.concat(i + 1)).style.background = 'none';
        }
        if (Game.upgrades[i].unlocked == true) getId('upgrade'.concat(i + 1)).style.background = '#50FF50'; //green

        getId('upgradeName'.concat(i + 1)).innerHTML = 'Name: ' + Game.upgrades[i].name;
        getId('upgradeDesc'.concat(i + 1)).innerHTML = 'Description: ' + Game.upgrades[i].desc;
        getId('upgradePrice'.concat(i + 1)).innerHTML = 'Price: <b>$' + Beautify(Game.upgrades[i].price, 0) + '</b>';
    }

    //BANK
    getId('storedMoney').innerHTML = 'Stored money: <b>$' + Beautify(Game.bank.storedMoney) + '</b>';
    getId('moneyRate').innerHTML = 'Interest rate: <b>' + Beautify(Game.bank.moneyRate) + '%</b>';

    //STATISTICS
    getId('moneyEarned').innerHTML = '<b>Money earned during entire gameplay:</b> $' + Beautify(Game.moneyEarned);
    getId('incomePerMinute').innerHTML = '<b>Income per minute:</b> $' + Beautify(Game.moneyIncome * 60);
    getId('incomeMultiplier').innerHTML = '<b>Income multiplier:</b> ' + Beautify(Game.incomeMultiplier) + '%';
    getId('buildingsOwned').innerHTML = '<b>Buildings owned in total:</b> ' + Beautify(Game.buildingsAmount);
    getId('salaryPaid').innerHTML = '<b>Total salary paid to workers:</b> $' + Beautify(Game.workers.salaryPaid);
    getId('workersGains').innerHTML = '<b>Cumulative gains from workers:</b> $' + Beautify(Game.workers.cumulativeGains);
    for (var i = 0; i < Game.buildings.length; i++) {
        getId('cumulative'.concat(i + 1)).innerHTML = '<b>Cumulative income per second from ' + Game.buildings[i].name + ':</b> $' + Beautify(Game.buildings[i].cumulativeIncome);
        getId('cumulativeGains'.concat(i + 1)).innerHTML = '<b>Cumulative gains from ' + Game.buildings[i].name + ':</b> $' + Beautify(Game.buildings[i].cumulativeGains);
    }

    //ACHIEVEMENTS

    for (var i = 0; i < Game.achievements.length; i++) {
        getId('achievementName'.concat(i + 1)).innerHTML = 'Name: ' + Game.achievements[i].name;
        getId('achievementDesc'.concat(i + 1)).innerHTML = 'Description: ' + Game.achievements[i].desc;
        if (Game.achievements[i].unlocked) getId('achievement'.concat(i + 1)).style.display = 'block';
        else
            getId('achievement'.concat(i + 1)).style.display = 'none';

    }

    //WORKERS
    getId('workersAmount').innerHTML = 'Amount: ' + Game.workers.amount;
    getId('workersPrice').innerHTML = 'Price: $' + Beautify(Game.workers.price, 0);
    getId('workersIncome').innerHTML = 'Cumulative income: $' + Beautify(Game.workers.cumulativeIncome);
    getId('workersSalary').innerHTML = 'Salary to pay: $' + Beautify(Game.workers.salary, 0);


    //HAVE TO COMPLETELY REWORK THIS

    if (Game.tick % (Game.fps) == 0) Game.workers.remainingTime--;
    if (Game.workers.remainingTime == 0) {
        Game.workers.remainingTime = Game.workers.paymentTime;
        console.log('test');
    }

    getId('time').innerHTML = 'Remaining time to payout: <b>' + parseInt(Game.workers.remainingTime / 60) + ':' + parseInt(Game.workers.remainingTime % 60) + '</b>';
}

/*=================================================
LOGIC
==================================================*/

Game.Logic = function () {
    Game.UpdateIncome = function () {
        var accumulatedIncome = 0;

        for (var i = 0; i < Game.buildings.length; i++) {
            accumulatedIncome += (Game.buildings[i].baseIncome * (Math.pow(1.05, Game.buildings[i].amount) - 1)) / (0.05);
            Game.buildings[i].cumulativeIncome = ((Game.buildings[i].baseIncome * (Math.pow(1.05, Game.buildings[i].amount) - 1)) / 0.05) * Game.incomeMultiplier / 100;
        }
        accumulatedIncome += (Game.workers.baseIncome * (Math.pow(1.05, Game.workers.amount) - 1)) / (0.05)

        if (Game.bonus) Game.moneyIncome = (accumulatedIncome * Game.incomeMultiplier / 100) * Game.bonusMultiplier;
        else
            Game.moneyIncome = accumulatedIncome * Game.incomeMultiplier / 100;
    }

    for (var i = 0; i < Game.buildings.length; i++) {
        Game.buildings[i].price = Math.pow(1.15, Game.buildings[i].amount) * Game.buildings[i].basePrice;
        Game.buildings[i].income = Math.pow(1.05, Game.buildings[i].amount) * Game.buildings[i].baseIncome;
    }

    Game.UpdateIncome();

    for (var i = 0; i < Game.buildings.length; i++) {
        Game.buildings[i].cumulativeGains += Game.buildings[i].cumulativeIncome * (Game.bonus?Game.bonusMultiplier:1) / Game.fps;
    }

    //WORKERS RELATED

    Game.workers.price = Math.pow(1.15, Game.workers.amount) * Game.workers.basePrice;
    Game.workers.income = Math.pow(1.05, Game.workers.amount) * Game.workers.baseIncome;
    Game.workers.cumulativeIncome = ((Game.workers.baseIncome * (Math.pow(1.05, Game.workers.amount) - 1)) / 0.05) * Game.incomeMultiplier / 100;
    Game.workers.cumulativeGains += Game.workers.cumulativeIncome * (Game.bonus ? Game.bonusMultiplier : 1) / Game.fps;

    Game.workers.salary = (Game.moneyIncome /2) * (Game.workers.cumulativeIncome / 100);

    Game.GetMoney(Game.moneyIncome / Game.fps);

    for (var i = 0; i < Game.upgrades.length; i++) {
        if (Game.upgrades[i].unlocked && !Game.upgrades[i].used) {
            Game.upgrades[i].effect();
            Game.upgrades[i].used = true;
        }
    }

    var buildingsAmount = 0;
    for (var i = 0; i < Game.buildings.length; i++) {
        buildingsAmount += Game.buildings[i].amount;
    }

    Game.buildingsAmount = buildingsAmount;

    var upgradesUnlocked = 0;
    for (var i = 0; i < Game.upgrades.length; i++) {
        if (Game.upgrades[i].unlocked)
            upgradesUnlocked++;
    }

    Game.upgradesUnlocked = upgradesUnlocked;

    //ACHIEVEMENTS UNLOCKING
    if (Game.moneyEarned >= 10000) Game.UnlockAchievement('Little business');
    if (Game.moneyEarned >= 100000) Game.UnlockAchievement('Getting serious');
    if (Game.moneyEarned >= 1000000) Game.UnlockAchievement('Millionaire');
    if (Game.moneyEarned >= 1000000000) Game.UnlockAchievement('Billionaire');
    if (Game.money >= 1000000) Game.UnlockAchievement('Big pockets');
    if (Game.upgradesUnlocked == Game.upgrades.length) Game.UnlockAchievement('Enhancer');

    //BONUS

    if (Game.bonus) {
        if (Game.tick % (Game.fps) == 0) {
            Game.bonusTimeRemaining--;
        }
        if (Game.bonusTimeRemaining == 0) {
            Game.bonusTimeRemaining = Game.bonusTime;
            Game.bonus = false;
        }
    }

    if (Game.tick % (Game.fps * 10) == 0 && Game.tick > Game.fps * 10) {
        if (Game.bank.storedMoney > 0) {
            Game.bank.storedMoney += Game.bank.storedMoney * Game.bank.moneyRate / 100;
            console.log('masz wiecej hajsu');
        }
    }
    if (Game.tick % (Game.fps * 60) == 0 && Game.tick > Game.fps * 10) Game.WriteSave();
    if (Game.tick % (Game.fps * getRandom(60, 160)) == 0 && Game.tick > Game.fps * 30 && !Game.bonus) {
        Game.bonus = true;
        Game.bonusCount++;
    }
    if (Game.tick % (Game.fps * Game.workers.paymentTime) == 0 && Game.tick > Game.fps * Game.workers.paymentTime - 1) Game.workers.Pay();
    Game.tick++;
}

/*=================================================
THE MAIN LOOP
==================================================*/

Game.Loop = function () {
    Game.Logic();
    Game.DrawUpdate();

    setTimeout(Game.Loop, 1000 / Game.fps);
}

/*=================================================
LAUNCHING
==================================================*/

onload = function () {
    Game.Init();
    Game.Loop();
    console.info('Game has started');
}