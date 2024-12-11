document.getElementById("calculate-btn").addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const height = document.getElementById("height").value;
    const weight = document.getElementById("weight").value;
    const gender = document.querySelector('input[name="gender"]:checked');

    // Validation
    if (!name || !age || !height || !weight || !gender) {
        alert("Please fill in all the fields!");
        return;
    }

    // BMI Calculation
    const bmi = calculateBMI(height, weight);
    const healthyWeightRange = getHealthyWeightRange(height);
    const message = createMessage(name, age, gender.value, height, weight, bmi, healthyWeightRange, weight);

    // Fetch Nutrition Information
    fetchNutritionInfo(age, gender.value, weight, height).then(nutritionInfo => {
        // Add nutrition info to the modal
        showModal(message, nutritionInfo);
    });
});

function calculateBMI(height, weight) {
    return weight / ((height / 100) ** 2);
}

function getHealthyWeightRange(height) {
    const minHeight = height / 100;
    return [18.5 * (minHeight ** 2), 24.9 * (minHeight ** 2)];
}

function createMessage(name, age, gender, height, weight, bmi, [minWeight, maxWeight], currentWeight) {
    let category;
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 18.5 && bmi <= 24.9) category = "Healthy";
    else if (bmi >= 25 && bmi <= 29.9) category = "Overweight";
    else category = "Obese";

    let adjustment = "";
    if (bmi < 18.5) {
        adjustment = `You need to gain ${(minWeight - currentWeight).toFixed(1)} kg to reach a healthy weight.`;
    } else if (bmi > 24.9) {
        adjustment = `You need to lose ${(currentWeight - maxWeight).toFixed(1)} kg to reach a healthy weight.`;
    } else {
        adjustment = `Your weight is within a healthy range.`;
    }

    return `
        Name: ${name} <br>
        Age: ${age} <br>
        Gender: ${gender.charAt(0).toUpperCase() + gender.slice(1)} <br>
        Height: ${height} cm <br>
        Weight: ${weight} kg <br><br>
        Your BMI is ${bmi.toFixed(2)} (${category}). <br>
        ${adjustment}
    `;
}

function fetchNutritionInfo(food) {
    const apiKey = "28f57ec1f1b14fab8bf15bc15ef8dcf8"; // Replace with your actual API key
    const apiUrl = `https://api.spoonacular.com/food/ingredients/search?query=${food}&apiKey=${apiKey}`;

    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const ingredientId = data.results[0].id;
                // Now fetch detailed information using the ingredient ID
                const detailUrl = `https://api.spoonacular.com/food/ingredients/${ingredientId}/information?apiKey=${apiKey}`;
                
                return fetch(detailUrl)
                    .then(response => response.json())
                    .then(detailData => {
                        return {
                            calories: detailData.nutrition.nutrients.find(nutrient => nutrient.title === "Calories").amount,
                            name: detailData.name
                        };
                    });
            } else {
                throw new Error("Ingredient not found");
            }
        })
        .catch(error => {
            console.error('Error fetching nutrition info:', error);
            return null;
        });
}

// Modal functionality
function showModal(message, nutritionInfo) {
    const modal = document.getElementById("result-modal");
    document.getElementById("bmi-message").innerHTML = message;
    
    if (nutritionInfo) {
        const nutritionHTML = `
            <strong>Daily Calorie Requirement:</strong> ${nutritionInfo.dailyCalories} kcal <br>
            <strong>Calories Burned:</strong> ${nutritionInfo.calories} kcal
        `;
        document.getElementById("nutrition-info").innerHTML = nutritionHTML;
    }

    modal.style.display = "flex";

    document.querySelector(".close-btn").onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // Enable report generation
    document.getElementById("generate-report-btn").onclick = function() {
        generatePDF(message);
    };
}

// Generate PDF
function generatePDF(message) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("BMI Report", 14, 20);
    doc.setFontSize(12);
    doc.text(message.replace(/<br>/g, '\n'), 14, 30);

    doc.save("bmi_report.pdf");
}
document.getElementById("generate-report-btn").addEventListener("click", function () {
    generatePDF(message);
});

document.getElementById("calorie-calculator-btn").addEventListener("click", () => {
    // Show the calorie calculator modal
    document.getElementById("calorie-modal").style.display = "flex";
});

document.getElementById("close-calorie-modal").addEventListener("click", () => {
    // Close the calorie calculator modal
    document.getElementById("calorie-modal").style.display = "none";
});

document.getElementById("fetch-calories-btn").addEventListener("click", () => {
    const minCalories = document.getElementById("min-calories").value;
    const maxCalories = document.getElementById("max-calories").value;

    // Validation
    if (!minCalories || !maxCalories) {
        alert("Please enter both minimum and maximum calories!");
        return;
    }

    fetchFoodSuggestions(minCalories, maxCalories);
});

function fetchFoodSuggestions(minCalories, maxCalories) {
    const apiKey = "28f57ec1f1b14fab8bf15bc15ef8dcf8"; // Replace with your actual API key
    const apiUrl = `https://api.spoonacular.com/recipes/findByNutrients?minCalories=${minCalories}&maxCalories=${maxCalories}&number=5&apiKey=${apiKey}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                let foodHTML = "<h3>Suggested Foods:</h3>";
                data.forEach(food => {
                    foodHTML += `
                        <div class="food-item">
                            <h4>${food.title}</h4>
                            <img src="${food.image}" alt="${food.title}" width="150" height="150">
                            <p>Calories: ${food.calories}</p>
                            <p>Carbs: ${food.carbs}</p>
                            <p>Fat: ${food.fat}</p>
                            <p>Protein: ${food.protein}</p>
                        </div>
                    `;
                });
                document.getElementById("food-suggestions").innerHTML = foodHTML;
            } else {
                document.getElementById("food-suggestions").innerHTML = "<p>No foods found for this calorie range.</p>";
            }
        })
        .catch(error => {
            console.error('Error fetching food suggestions:', error);
            document.getElementById("food-suggestions").innerHTML = "<p>Failed to fetch food suggestions. Please try again later.</p>";
        });
}
