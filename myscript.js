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

    Game.workers = [];
    Game.workers.amount = 0;
    Game.workers.baseIncome = 5;
    Game.workers.income = 5;
    Game.workers.basePrice = 50;
    Game.workers.price = 50;
    Game.workers.salary = 0;

    Game.workers.Buy = function () {
        if (this.price > Game.money) {
            alert('Nie masz wystarczajaco pieniedzy');
        }
        else {
            Game.Spend(this.price);
            this.amount++;
        }
    }

    Game.workers.Pay = function () {
        if (Game.workers.salary >= Game.money) {
            Game.money = 0;
        }
        else {
            Game.money -= this.salary;
        }
        console.log('You have paid ' + Game.workers.salary);
    }


    Game.GetMoney = function (howmuch) {
        Game.money += howmuch;
        Game.moneyEarned += howmuch;
    }

    Game.Spend = function (howmuch) {
        Game.money -= howmuch;
    }

    Game.buildings = [];
    Game.buildings.push({ name: "Łopata", basePrice: 20, price: 20, baseIncome: 1, income: 1, amount: 0, cumulativeIncome: 0 });
    Game.buildings.push({ name: "Kopalnia", basePrice: 50, price: 50, baseIncome: 3, income: 3, amount: 0, cumulativeIncome: 0 });
    Game.buildings.push({ name: "Ulepszona kopalnia", basePrice: 100, price: 100, baseIncome: 5, income: 5, amount: 0, cumulativeIncome: 0 });

    Game.upgrades = [];
    Game.upgrades.push({
        name: 'Simple Enhancer #1', desc: 'Increases the income multiplier by 20%', unlocked: false, price: 15000, effect:
            function () {
                Game.incomeMultiplier += 20;
            }, used: false

    });
    Game.upgrades.push({
        name: 'Simple Enhancer #2', desc: 'Increases the income multiplier by 25%', unlocked: false, price: 50000, effect:
            function () {
                Game.incomeMultiplier += 25;
            }, used: false

    });
    Game.upgrades.push({
        name: 'Enhancer #3', desc: 'Increases the income multiplier by 35%', unlocked: false, price: 100000, effect:
            function () {
                Game.incomeMultiplier += 35;
            }, used: false

    });

    Game.upgrades.push({
        name: 'Superior Enhancer #4', desc: 'Increases the income multiplier by 50%', unlocked: false, price: 200000, effect:
            function () {
                Game.incomeMultiplier += 50;
            }, used: false

    });

    /*=================================================
    NEW DRAWING SYSTEM TEST
    ==================================================*/
    Game.InitDrawing = function () {
        //BUILDINGS
        var miningTab = getId('view1');

        for (var i = 0; i < Game.buildings.length; i++) {
            var buildingItem = document.createElement('div');
            buildingItem.id = 'buildingItem' + (i + 1);
            buildingItem.className = 'buildingItem';
            miningTab.appendChild(buildingItem);

            var buildingName = document.createElement('span');
            buildingName.id = 'buildingName' + (i + 1);
            buildingName.className = 'buildingName';
           // buildingName.appendChild(document.createTextNode(Game.buildings[i].name));
            buildingItem.appendChild(buildingName);

            var buildingPrice = document.createElement('span');
            buildingPrice.id = 'buildingPrice' + (i + 1);
            buildingPrice.className = 'buildingPrice';
            //buildingPrice.appendChild(document.createTextNode('Cena: ' + Beautify(Game.buildings[i].price, 0)));
            buildingItem.appendChild(buildingPrice);

            var buildingAmount = document.createElement('span');
            buildingAmount.id = 'buildingAmount' + (i + 1);
            buildingAmount.className = 'buildingAmount';
           // buildingAmount.appendChild(document.createTextNode('Ilosc: ' + Game.buildings[i].amount));
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
        var upgradesTab = getId('view2');

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

        //OPTIONS

        Game.CreateButton = function (id, classname, callback, name) {
            var button = document.createElement('a');
            button.id = id;
            button.className = classname;
            button.appendChild(document.createTextNode(name));
            button.setAttribute('onclick', callback);
            return button;
        }

        var optionsTab = getId('view5');

        optionsTab.appendChild(Game.CreateButton('btnSaveGame', 'button', 'Game.WriteSave()', 'Save Game'));
        optionsTab.appendChild(Game.CreateButton('btnExport', 'button', 'Game.ExportSave()', 'Export Game'));
        optionsTab.appendChild(Game.CreateButton('btnImport', 'button', 'Game.ImportSave()', 'Import Game'));
        optionsTab.appendChild(Game.CreateButton('btnReset', 'button', 'Game.Reset()', 'Reset'));
      
        //WORKERS

        var workersTab = getId('view3');

        workersTab.appendChild(Game.CreateButton('addWorker', 'button', 'Game.workers.Buy()', 'Buy a worker'));
        var workersAmount = document.createElement('div');
        workersAmount.id = 'workersAmount';
        var workersPrice = document.createElement('div');
        workersPrice.id = 'workersPrice';
        var workersIncome = document.createElement('div');
        workersIncome.id = 'workersIncome';
        var workersSalary = document.createElement('div');
        workersSalary.id = 'workersSalary';
        workersTab.appendChild(workersAmount);
        workersTab.appendChild(workersPrice);
        workersTab.appendChild(workersIncome);
        workersTab.appendChild(workersSalary);
    }

    Game.InitDrawing();

    Game.BuildingsListener = function (i) {
        AddEvent(getId('buyBuilding'.concat(i + 1)), 'click',
            function () {
                if (Game.buildings[i].price > Game.money) {
                    alert('Nie masz wystarczajaco pieniedzy');
                }
                else {
                    Game.Spend(Game.buildings[i].price);
                    Game.buildings[i].amount++;
                    //Game.buildings[i].price = Math.pow(1.15, Game.buildings[i].amount) * Game.buildings[i].basePrice;

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
                    //Game.buildings[i].price = Math.pow(1.15, Game.buildings[i].amount) * Game.buildings[i].basePrice;

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

    Game.WriteSave = function (exporting) {
        var str = '';
        str += Game.moneyEarned + '|';
        str += Game.money + '|';
        str += Game.moneyIncome + '|';
        str += Game.incomeMultiplier + '|';
        str += Game.buildingsAmount + '|';

        for (var i = 0; i < Game.buildings.length; i++) {
            str += Game.buildings[i].price + '|';
            str += Game.buildings[i].income + '|';
            str += Game.buildings[i].amount + '|';
        }
        for (var i = 0; i < Game.upgrades.length; i++) {
            if (Game.upgrades[i].unlocked == true) {
                str += 'true|';
            }
            else {
                str += 'false|';
            }

            if (Game.upgrades[i].used == true)
                str += 'true|';
            else
                str += 'false|';
        }
        var now = new Date();
        now.setFullYear(now.getFullYear() + 5);
        str = Game.name + '=' + str + 'expires=' + now.toUTCString() + ';';
        document.cookie = str;
        if (exporting) {
            return str;
        }
        console.info('Game has been saved');
    }

    Game.ExportSave = function () {
        prompt('Copy this save: ', Game.WriteSave(1));
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
        else if (document.cookie.indexOf(Game.name) >= 0) 
        {
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

            var temp = 5;
            var counter = 0;
            for (var i = 0; i < Game.buildings.length; i++) {
                Game.buildings[i].price = parseInt(save[temp + counter]);
                counter++;
                Game.buildings[i].income = parseInt(save[temp + counter]);
                counter++;
                Game.buildings[i].amount = parseInt(save[temp + counter]);
                counter++;
            }

            for (var i = 0; i < Game.upgrades.length; i++) {
                if (save[temp + counter] == 'true') {
                    Game.upgrades[i].unlocked = true;
                }
                counter++;
                if (save[temp + counter] == 'true') {
                    Game.upgrades[i].used = true;
                }
                counter++;
            }

            console.info('Game has been loaded from a save');
        }

    }

    Game.Reset = function () {
        Game.moneyEarned = 0;
        Game.money = 20;
        Game.moneyIncome = 0;
        Game.incomeMultiplier = 100;
        Game.buildingsAmount = 0;

        for (var i = 0; i < Game.buildings.length; i++) {
            Game.buildings[i].price = Game.buildings[i].basePrice;
            Game.buildings[i].income = Game.buildings[i].baseIncome;
            Game.buildings[i].amount = 0;
        }

        for (var i = 0; i < Game.upgrades.length; i++) {
            Game.upgrades[i].unlocked = false;
            Game.upgrades[i].used = false;
        }

    }

    Game.LoadSave();
}

/*=================================================
DRAWING
==================================================*/

Game.Draw = function () {

    //UPPER BAR
    var money = getId('money');
    money.innerHTML = "Current money: $" + Beautify(Game.money, 0);
    var income = getId('income');
    income.innerHTML = "Income per second: $" + Beautify(Game.moneyIncome, 0);

    //BUILDINGS
    for (var i = 0; i < Game.buildings.length; i++) {
       getId('buildingName'.concat(i + 1)).innerHTML = Game.buildings[i].name;
       getId('buildingPrice'.concat(i + 1)).innerHTML = 'Cena: ' + Beautify(Game.buildings[i].price,0);
       getId('buildingAmount'.concat(i + 1)).innerHTML = 'Ilosc: ' + Game.buildings[i].amount;
    }

    for (var i = 0; i < Game.upgrades.length; i++) {
        if (Game.money < Game.upgrades[i].price || !Game.upgrades[i].unlocked) getId('upgrade'.concat(i + 1)).style.background = '#FF3333'; //red
        if (Game.upgrades[i].price < Game.money && !Game.upgrades[i].unlocked) {
            //if (Math.floor(Game.tick % 5) == 0)
            getId('upgrade'.concat(i + 1)).style.background = 'none';
        }
        if (Game.upgrades[i].unlocked == true) getId('upgrade'.concat(i + 1)).style.background = '#50FF50'; //green

        getId('upgradeName'.concat(i + 1)).innerHTML = 'Nazwa: ' + Game.upgrades[i].name;
        getId('upgradeDesc'.concat(i + 1)).innerHTML = 'Description: ' + Game.upgrades[i].desc;
        getId('upgradePrice'.concat(i + 1)).innerHTML = 'Price: $' + Beautify(Game.upgrades[i].price, 0);
    }


    //STATISTICS
    getId('moneyEarned').innerHTML = '<b>Money earned during entire gameplay:</b> $' + Beautify(Game.moneyEarned);
    getId('incomePerMinute').innerHTML = '<b>Income per minute:</b> $' + Beautify(Game.moneyIncome * 60);
    getId('incomeMultiplier').innerHTML = '<b>Income multiplier:</b> ' + Beautify(Game.incomeMultiplier) + '%';
    getId('ownedBuildings').innerHTML = '<b>Owned buildings in total:</b> ' + Beautify(Game.buildingsAmount);
    for (var i = 0; i < Game.buildings.length; i++) {
        getId('cumulative'.concat(i + 1)).innerHTML = '<b>Income from ' + Game.buildings[i].name + ':</b> $' + Beautify(Game.buildings[i].cumulativeIncome);
    }


    //WORKERS
    getId('workersAmount').innerHTML = 'Amount: ' + Game.workers.amount;
    getId('workersPrice').innerHTML = 'Price: ' + Beautify(Game.workers.price,0);
    getId('workersIncome').innerHTML = 'Income: ' + Beautify(Game.workers.income  * Game.incomeMultiplier / 100, 0);
    getId('workersSalary').innerHTML = 'Salary to pay: ' + Beautify(Game.workers.salary, 0);

    //if (Math.floor(Game.tick % 5) == 0) Game.UpdateMenu();

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

        Game.moneyIncome = accumulatedIncome * Game.incomeMultiplier / 100;
    }

    for (var i = 0; i < Game.buildings.length; i++) {
        Game.buildings[i].price = Math.pow(1.15, Game.buildings[i].amount) * Game.buildings[i].basePrice;
        Game.buildings[i].income = Math.pow(1.05, Game.buildings[i].amount) * Game.buildings[i].baseIncome;
    }

    Game.workers.price = Math.pow(1.15, Game.workers.amount) * Game.workers.basePrice;
    Game.workers.income = Math.pow(1.05, Game.workers.amount) * Game.workers.baseIncome;
    Game.workers.salary = (Game.workers.income * Game.workers.amount);

    Game.UpdateIncome();

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

    if (Game.tick % (Game.fps * 60) == 0 && Game.tick > Game.fps * 10) Game.WriteSave();
    if (Game.tick % (Game.fps * 300) == 0 && Game.tick > Game.fps * 299) Game.workers.Pay();
    Game.tick++;
}

/*=================================================
THE MAIN LOOP
==================================================*/

Game.Loop = function () {
    Game.Logic();
    Game.Draw();

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