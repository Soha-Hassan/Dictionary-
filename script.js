// Dictionary API configuration
const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const historyContainer = document.getElementById('historyContainer');
const historyList = document.getElementById('historyList');
const favoritesContainer = document.getElementById('favoritesContainer');
const favoritesList = document.getElementById('favoritesList');
const historyTab = document.getElementById('historyTab');
const favoritesTab = document.getElementById('favoritesTab');

// State
let searchHistory = JSON.parse(localStorage.getItem('dictionaryHistory')) || [];
let favorites = JSON.parse(localStorage.getItem('dictionaryFavorites')) || [];

// Initialize the app
function init() {
    renderHistory();
    renderFavorites();
    fetchDailyQuote();
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    historyTab.addEventListener('click', () => {
        showTab('history');
        historyTab.classList.add('active');
        favoritesTab.classList.remove('active');
    });
    
    favoritesTab.addEventListener('click', () => {
        showTab('favorites');
        favoritesTab.classList.add('active');
        historyTab.classList.remove('active');
    });
}

// Handle search
async function handleSearch() {
    const word = searchInput.value.trim();
    if (!word) return;
    
    showLoading(true);
    resultsContainer.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE}${word}`);
        if (!response.ok) throw new Error('Word not found');
        
        const data = await response.json();
        
        // Add to history if not already there
        if (!searchHistory.includes(word.toLowerCase())) {
            searchHistory.unshift(word.toLowerCase());
            localStorage.setItem('dictionaryHistory', JSON.stringify(searchHistory));
            renderHistory();
        }
        
        displayResults(data);
        showTab('results');
    } catch (error) {
        displayError(error.message);
    } finally {
        showLoading(false);
    }
}

// Display search results
function displayResults(data) {
    resultsContainer.innerHTML = '';
    
    data.forEach(entry => {
        const wordCard = document.createElement('div');
        wordCard.className = 'word-card bg-white rounded-xl shadow-md p-6';
        
        // Header with word, phonetic, and favorite button
        const header = document.createElement('div');
        header.className = 'flex justify-between items-start mb-4';
        
        const wordInfo = document.createElement('div');
        wordInfo.className = 'flex-grow';
        
        const wordTitle = document.createElement('h2');
        wordTitle.className = 'text-3xl font-bold text-indigo-600';
        wordTitle.textContent = entry.word;
        
        const phonetic = document.createElement('p');
        phonetic.className = 'phonetic text-gray-500 italic mb-2';
        const foundPhonetic = entry.phonetics.find(p => p.text)?.text || 'No phonetic available';
        phonetic.textContent = foundPhonetic;
        
        wordInfo.appendChild(wordTitle);
        wordInfo.appendChild(phonetic);
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'p-2 rounded-full hover:bg-gray-100';
        const isFavorite = favorites.includes(entry.word.toLowerCase());
        const favoriteIcon = document.createElement('span');
        favoriteIcon.className = 'text-2xl';
        favoriteIcon.textContent = isFavorite ? '★' : '☆';
        favoriteIcon.style.color = isFavorite ? 'var(--secondary)' : 'var(--dark)';
        
        favoriteBtn.appendChild(favoriteIcon);
        favoriteBtn.addEventListener('click', () => toggleFavorite(entry.word));
        
        header.appendChild(wordInfo);
        header.appendChild(favoriteBtn);
        
        wordCard.appendChild(header);
        
        // Meanings
        entry.meanings.forEach(meaning => {
            const meaningSection = document.createElement('div');
            meaningSection.className = 'mb-6';
            
            const partOfSpeech = document.createElement('h3');
            partOfSpeech.className = 'text-xl font-semibold text-gray-800 mb-2';
            partOfSpeech.textContent = meaning.partOfSpeech;
            
            meaningSection.appendChild(partOfSpeech);
            
            // Definitions
            const definitionsList = document.createElement('ul');
            definitionsList.className = 'list-disc pl-6 space-y-2';
            
            meaning.definitions.slice(0, 5).forEach(def => {
                const item = document.createElement('li');
                const defText = document.createElement('p');
                defText.className = 'text-gray-700';
                defText.textContent = def.definition;
                
                item.appendChild(defText);
                
                if (def.example) {
                    const example = document.createElement('p');
                    example.className = 'text-gray-500 italic mt-1';
                    example.textContent = `Example: "${def.example}"`;
                    item.appendChild(example);
                }
                
                definitionsList.appendChild(item);
            });
            
            meaningSection.appendChild(definitionsList);
            wordCard.appendChild(meaningSection);
        });
        
        resultsContainer.appendChild(wordCard);
    });
    
    showTab('results');
}

// Display error
function displayError(message) {
    resultsContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-md p-6 text-center">
            <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/cf2c861e-2f19-44f5-b57b-42e8c74cc402.png" alt="Confused robot looking at empty dictionary page" class="mx-auto mb-4">
            <h3 class="text-xl font-semibold text-red-500 mb-2">Oops!</h3>
            <p class="text-gray-700">${message}. Please try another word.</p>
        </div>
    `;
    resultsContainer.classList.remove('hidden');
}

// Toggle favorite status
function toggleFavorite(word) {
    const lowerWord = word.toLowerCase();
    const index = favorites.indexOf(lowerWord);
    
    if (index === -1) {
        favorites.push(lowerWord);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('dictionaryFavorites', JSON.stringify(favorites));
    renderFavorites();
    
    // Refresh current view
    if (!resultsContainer.classList.contains('hidden')) {
        handleSearch();
    }
}

// Render search history
function renderHistory() {
    historyList.innerHTML = '';
    
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<p class="text-gray-500">Your search history is empty</p>';
        return;
    }
    
    searchHistory.forEach(word => {
        const item = document.createElement('div');
        item.className = 'bg-white rounded-lg shadow p-4 flex justify-between items-center';
        
        const wordElement = document.createElement('span');
        wordElement.className = 'font-medium';
        wordElement.textContent = word;
        
        const searchAgainBtn = document.createElement('button');
        searchAgainBtn.className = 'text-indigo-600 hover:text-indigo-800 text-sm';
        searchAgainBtn.textContent = 'Search';
        searchAgainBtn.addEventListener('click', () => {
            searchInput.value = word;
            handleSearch();
        });
        
        item.appendChild(wordElement);
        item.appendChild(searchAgainBtn);
        historyList.appendChild(item);
    });
}

// Render favorites
function renderFavorites() {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="text-gray-500">You have no favorite words yet</p>';
        return;
    }
    
    favorites.forEach(word => {
        const item = document.createElement('div');
        item.className = 'bg-white rounded-lg shadow p-4 flex justify-between items-center';
        
        const wordElement = document.createElement('span');
        wordElement.className = 'font-medium';
        wordElement.textContent = word;
        
        const searchAgainBtn = document.createElement('button');
        searchAgainBtn.className = 'text-indigo-600 hover:text-indigo-800 text-sm';
        searchAgainBtn.textContent = 'Search';
        searchAgainBtn.addEventListener('click', () => {
            searchInput.value = word;
            handleSearch();
        });
        
        item.appendChild(wordElement);
        item.appendChild(searchAgainBtn);
        favoritesList.appendChild(item);
    });
}

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

// Show selected tab
function showTab(tab) {
    if (tab === 'results') {
        resultsContainer.classList.remove('hidden');
        historyContainer.classList.add('hidden');
        favoritesContainer.classList.add('hidden');
        historyTab.classList.remove('active');
        favoritesTab.classList.remove('active');
    } else if (tab === 'history') {
        resultsContainer.classList.add('hidden');
        historyContainer.classList.remove('hidden');
        favoritesContainer.classList.add('hidden');
    } else if (tab === 'favorites') {
        resultsContainer.classList.add('hidden');
        historyContainer.classList.add('hidden');
        favoritesContainer.classList.remove('hidden');
    }
}

// Dynamic Quotes API
async function fetchDailyQuote() {
    try {
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();
        document.getElementById('dailyQuote').textContent = `"${data.content}" - ${data.author}`;
    } catch {
        document.getElementById('dailyQuote').textContent = '"Words are a lens to focus one\'s mind." - Ayn Rand';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);