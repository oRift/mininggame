
const stats = [
    { name: "Fortune" },
    { name: "Greed" },
    { name: "Professional" }
];

// SHOP VARIABLES

let coinMultiplier = 1;
let luck = 1;
let miningDamage = 1;

// GRID SECTION

const grid = document.getElementById("mining-grid");
const cashText = document.getElementById("cash");
const respawnButton = document.getElementById("respawn");

// Money variables

let cash = 0;
let displayedCash = 0;
let previousCash = 0;

// Animation variables

let cashAnimation = null;
let animationStartCash = 0;
let animationStartTime = 0;
let animationTargetCash = 0;

// Ore table

const ores = [
    {
        name: "Stone",
        image: "assets/stone.png",
        chance: 60,
        health: 1,
        coins: 1
    },
    {
        name: "Copper",
        image: "assets/copper.png",
        chance: 25,
        health: 2,
        coins: 5
    },
    {
        name: "Gold",
        image: "assets/gold.png",
        chance: 12,
        health: 3,
        coins: 10
    },
    {
        name: "Diamond",
        image: "assets/diamond.png",
        chance: 3,
        health: 4,
        coins: 50
    }
];

const inventory = {};
const tiles = [];

// Generate random ore

function oreGenerator() {
    // Calculate adjusted ore weights
    const adjustedChances = ores.map((ore, index) => {
        const luckMultiplier = [1, 2, 3, 4][index];

        return ore.chance * Math.pow(luck, luckMultiplier - 1);
    });

    // Calculate the new total weight
    const totalChance = adjustedChances.reduce(
        (total, chance) => total + chance, 0
    );

    // Generate a random number within the new total
    const oreRoll = Math.random() * totalChance;

    let total = 0;

    for (let i = 0; i < ores.length; i++) {
        total += adjustedChances[i];

        if (oreRoll < total) {
            return ores[i];
        }
    }

    return ores[0];
}

// Money effects

function showMoneyEffect(type) {
    cashText.classList.remove("money-gain", "money-loss");

    void cashText.offsetWidth;

    if (type === "gain") {
        cashText.classList.add("money-gain");
    } else if (type === "loss") {
        cashText.classList.add("money-loss");
    }
}

// Update cash display

function updateCashDisplay() {
    if (cash > previousCash) {
        showMoneyEffect("gain");
    } else if (cash < previousCash) {
        showMoneyEffect("loss");
    }

    previousCash = cash;

    animationStartCash = displayedCash;
    animationStartTime = performance.now();
    animationTargetCash = cash;

    if (cashAnimation === null) {
        cashAnimation = requestAnimationFrame(animateCash);
    }
}

// Animate cash counter

function animateCash(currentTime) {
    const duration = 500;
    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    displayedCash = Math.floor(
        animationStartCash +
        (animationTargetCash - animationStartCash) * easedProgress
    );

    cashText.textContent = `Cash: $${displayedCash}`;

    if (progress < 1) {
        cashAnimation = requestAnimationFrame(animateCash);
    } else {
        displayedCash = animationTargetCash;
        cashText.textContent = `Cash: $${displayedCash}`;
        cashAnimation = null;
    }
}

// Mine a tile

function mineTile(tileData) {
    if (tileData.mined) return;

    tileData.currentHealth -= miningDamage;

    const element = tileData.element;

    // Tile shake animation
    element.classList.remove("shake");
    void element.offsetWidth;
    element.classList.add("shake");

    // Ore still has health remaining
    if (tileData.currentHealth > 0) {

        const healthPercentage =
            (tileData.currentHealth / tileData.maxHealth) * 100;

        // Display health bar inside tile
        if (!tileData.healthBar.isConnected) {
            element.replaceChildren(tileData.healthBar);
        }

        tileData.healthFill.style.width = `${healthPercentage}%`;

        return;
    }

    // Ore has been mined
    tileData.mined = true;

    const ore = tileData.ore;

    // Create ore image
    const image = document.createElement("img");
    image.src = ore.image;
    image.alt = ore.name;

    // Replace health bar with ore image
    element.replaceChildren(image);

    element.classList.add("empty");
    element.disabled = true;

    // Update inventory
    inventory[ore.name] = (inventory[ore.name] || 0) + 1;

    // Give money
    cash += Math.round(ore.coins * coinMultiplier);

    updateCashDisplay();
}

// Generate all 64 tiles

function generateTiles() {
    grid.replaceChildren();
    tiles.length = 0;

    for (let i = 0; i < 64; i++) {

        const tileData = {
            id: i,
            ore: oreGenerator(),
            mined: false
        };

        tileData.currentHealth = tileData.ore.health;
        tileData.maxHealth = tileData.ore.health;

        // Create tile button
        const element = document.createElement("button");

        element.className = "tile";
        element.title = `Tile ${i + 1}`;

        // Create health bar
        const healthBar = document.createElement("div");
        healthBar.className = "health-bar";

        const healthFill = document.createElement("div");
        healthFill.className = "health-fill";

        healthBar.appendChild(healthFill);

        tileData.healthBar = healthBar;
        tileData.healthFill = healthFill;

        tileData.element = element;

        // Mining click event
        element.addEventListener("click", () => {
            mineTile(tileData);
        });

        tiles.push(tileData);
        grid.appendChild(element);
    }
}

// Respawn all tiles

function respawnTiles() {
    if (cash < 64) return;

    cash -= 64;

    updateCashDisplay();

    generateTiles();
}

// Respawn button

respawnButton.addEventListener("click", () => {
    respawnTiles();
});

// Start game

generateTiles();
updateCashDisplay();


// Shop

// PARENT CLASS

class ShopElement {

    constructor(name, image, price, description) {

        this.name = name;
        this.image = image;
        this.price = price;
        this.description = description;

        this.purchaseCount = 0;
        this.priceMultiplier = 1.5;

        this.button = null;
    }

    createButton() {

        const button = document.createElement("button");
        button.classList.add("shop-item");

        const image = document.createElement("img");
        image.src = this.image;
        image.alt = this.name;

        image.classList.add("shop-image");

        const name = document.createElement("span");
        name.textContent = this.name;

        name.classList.add("shop-name");

        const price = document.createElement("span");

        price.classList.add("shop-price");

        const description = document.createElement("p");
        description.textContent = this.description;

        description.classList.add("shop-description");

        button.appendChild(description);
        button.appendChild(image);
        button.appendChild(name);
        button.appendChild(price);
        

        this.button = button;

        button.addEventListener("click", () => {
            this.purchase();
        });

        this.updateButton();

        return button;
    }

    updateButton() {

        if (!this.button) return;

        const priceText = this.button.querySelector("span:last-child");

        priceText.textContent = `$${this.price}`;
    }

    increasePrice() {

        this.price = Math.ceil(
            this.price * this.priceMultiplier
        );

    }

    purchase() {

        if (cash < this.price) {
            return;
        };

        // Remove purchase cost
        cash -= this.price;

        // Increase purchase count
        this.purchaseCount++;

        // Apply the upgrade
        this.applyUpgrade();

        // Increase the next purchase's price
        this.increasePrice();

        // Update the cash display
        updateCashDisplay();

        // Update this item's button
        this.updateButton();

        // Update affordability of all shop items
        updateShopButtons();

    }


    // child classes override this method.

    applyUpgrade() {

        console.log("No upgrade assigned!");

    }

}

// CHILD CLASSES

class Greed extends ShopElement {

    applyUpgrade() {

        coinMultiplier += 0.2;

        console.log("Greed upgraded!");
        console.log("Coin multiplier:", coinMultiplier);

    }

}

class Fortune extends ShopElement {

    applyUpgrade() {

        luck += 0.1;

        console.log("Fortune upgraded!");
        console.log("Luck:", luck);

    }

}

class Drill extends ShopElement {

    applyUpgrade() {

        miningDamage += 0.25;

        console.log("Drill upgraded!");
        console.log("Mining damage:", miningDamage);

    }

}

// SHOP ITEMS

const shopElements = [

    new Greed(
        "Greed",
        "assets/Greed.png",
        100,
        "Increases coins earned"
    ),

    new Fortune(
        "Fortune",
        "assets/error.png",
        200,
        "More luck towards rarer ores"

    ),

    new Drill(
        "Drill",
        "assets/Drill.png",
        50,
        "Increases mining damage"
    )

];

// SHOP INITIALIZATION

const ShopFrame = document.querySelector(".shopFrame");


function initializeShop() {

    ShopFrame.replaceChildren();

    for (const item of shopElements) {

        const button = item.createButton();

        ShopFrame.appendChild(button);

    }

}

// UPDATE ALL SHOP BUTTONS

function updateShopButtons() {

    for (const item of shopElements) {

        item.updateButton();

    }

}

// CREATE SHOP

initializeShop();
