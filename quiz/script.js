const questions = [
    {
        category: "1",
        question: "What is the largest planet in our solar system?",
        options: ["Mercury", "Mars", "Jupiter", "Saturn"],
        answer: "Jupiter"
    },
    {
        category: "2",
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Neptune", "Jupiter"],
        answer: "Mars"
    },
    {
        category: "3",
        question: "What is the coldest planet in our solar system?",
        options: ["Mars", "Neptune", "Uranus", "Mercury"],
        answer: "Uranus"
    },
    {
        category: "4",
        question: "What is the brightest planet in our solar system?",
        options: ["Saturn", "Mercury", "Venus", "Earth"],
        answer: "Venus"
    },
    {
        category: "5",
        question: "Which planet is the closest to the sun?",
        options: ["Uranus", "Earth", "Neptune", "Mercury"],
        answer: "Mercury"
    }
];

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let shuffledQuestions = [];
let currentQuestionIndex = 0;
let progress = 0;
let score = 0; // Added score variable

const questionElem = document.getElementById('question');
const answerButtons = document.querySelectorAll('.answer');
const progressElem = document.getElementById('progress');
const scoreModal = document.getElementById('scoreModal');
const scoreMessage = document.getElementById('scoreMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

function startGame() {
    shuffledQuestions = [...questions];
    currentQuestionIndex = 0;
    score = 0;
    loadQuestion();
    answerButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => checkAnswer(index));
    });
}

function loadQuestion() {
    const questionData = shuffledQuestions[currentQuestionIndex];
    questionElem.innerText = questionData.question;

    const shuffledAnswers = [...questionData.options];
    shuffle(shuffledAnswers);
    answerButtons.forEach((btn, index) => {
        btn.innerText = shuffledAnswers[index];
        btn.classList.remove('correct', 'incorrect'); // Remove any previous correct/incorrect classes
        btn.disabled = false; // Re-enable the button
        btn.style.pointerEvents = 'auto'; // Re-enable hover and click events
        btn.classList.add('button-hover'); // Optionally re-add hover class if needed
    });

    progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
    progressElem.style.width = `${progress}%`;
}

function checkAnswer(selectedIndex) {
    const questionData = shuffledQuestions[currentQuestionIndex];
    const selectedAnswerText = answerButtons[selectedIndex].innerText;

    if (selectedAnswerText === questionData.answer) {
        answerButtons[selectedIndex].classList.add('correct');
        score++;
    } else {
        answerButtons[selectedIndex].classList.add('incorrect');
        // Highlight the correct answer
        answerButtons.forEach((btn) => {
            if (btn.innerText === questionData.answer) {
                btn.classList.add('correct');
            }
        });
    }
    answerButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('button-hover');  // Remove the hover class if present
        btn.style.pointerEvents = 'none'; // Disables the hover and click events
    });
    setTimeout(nextQuestion, 1000);
}

function endGame() {
    const message = score === 5 ? "Excellent! your are perfect" :score>3? `Be focus, your score ${score}`:score===0?`Game Over! Your score: ${score}/${questions.length}`:``;
    scoreMessage.innerText = message;
    scoreModal.style.display = "flex"; // Show the modal
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
        loadQuestion();
    } else {
        window.location.href = "./certificate.html";
    }
}

// Close modal when button is clicked
closeModalBtn.addEventListener('click', () => {
    scoreModal.style.display = "none";
});

startGame();
