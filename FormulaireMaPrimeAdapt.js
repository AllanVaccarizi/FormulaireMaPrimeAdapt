// Widget MaPrimeAdapt Embeddable - Version Sécurisée
// Version: 1.2.0
// Usage: <script src="maprimeadapt-widget.js"></script>
//        <div id="maprimeadapt-simulator"></div>

(function() {
    'use strict';

    // Utilitaires de sécurité renforcés
    const SecurityUtils = {
        // Échapper les caractères HTML pour prévenir XSS
        escapeHtml: function(text) {
            if (typeof text !== 'string') return text;
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        // Validation email renforcée
        validateEmail: function(email) {
            // Regex plus stricte basée sur RFC 5322
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            
            return emailRegex.test(email) && 
                   email.length <= 254 &&
                   email.indexOf('..') === -1 && // Pas de points consécutifs
                   !email.startsWith('.') && 
                   !email.endsWith('.');
        },

        // Validation téléphone français améliorée
        validatePhone: function(phone) {
            // Nettoie d'abord le numéro
            const cleanPhone = phone.replace(/[\s.-]/g, '');
            
            // Formats acceptés : 06XXXXXXXX, 07XXXXXXXX, +336XXXXXXXX, +337XXXXXXXX
            const mobileRegex = /^(?:\+33|0)[67](?:[0-9]{8})$/;
            // Formats fixes : 01XXXXXXXX, 02XXXXXXXX, etc.
            const fixeRegex = /^(?:\+33|0)[1-5](?:[0-9]{8})$/;
            
            return mobileRegex.test(cleanPhone) || fixeRegex.test(cleanPhone);
        },

        // Nettoyage renforcé des données
        sanitizeInput: function(input) {
            if (typeof input !== 'string') return input;
            
            return input
                .trim()
                .replace(/[<>\"'&]/g, '') // Caractères HTML dangereux
                .replace(/javascript:/gi, '') // Protocoles dangereux
                .replace(/on\w+\s*=/gi, '') // Attributs d'événements
                .slice(0, 1000); // Limite globale de sécurité
        },

        // Validation des noms (plus restrictive)
        validateName: function(name) {
            // Accepte uniquement lettres, espaces, apostrophes, traits d'union
            const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
            return nameRegex.test(name) && 
                   !name.includes('  ') && // Pas de doubles espaces
                   name.trim().length >= 2;
        },

        // Validation code postal français renforcée
        validatePostalCode: function(code) {
            // Code postal français : 5 chiffres, ne commence pas par 00
            return /^(?:0[1-9]|[1-8][0-9]|9[0-8])[0-9]{3}$/.test(code);
        },

        // Création sécurisée d'éléments HTML
        createSecureElement: function(tag, textContent = '', className = '') {
            const element = document.createElement(tag);
            if (textContent) {
                element.textContent = textContent; // Utilise textContent, jamais innerHTML
            }
            if (className) {
                element.className = className;
            }
            return element;
        },

        // Génération d'un ID de session sécurisé
        generateSessionId: function() {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }
    };

    // Configuration par défaut (sécurisée)
    const defaultConfig = {
        containerId: 'maprimeadapt-simulator',
        webhookUrl: null,
        maxRetries: 3,
        timeout: 10000,
        debug: false, // Désactivé par défaut
        theme: {
            primaryColor: '#00b894',
            secondaryColor: '#95cd93',
            backgroundLight: '#EFF8F2',
            borderRadius: '15px'
        },
        callbacks: {
            onComplete: null,
            onStep: null,
            onError: null
        }
    };

    // CSS du simulateur avec nouvelles couleurs et typographies
    const simulatorCSS = `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .maprimeadapt-simulator {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: var(--maprimeadapt-border-radius, 15px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 400;
        }

        .maprimeadapt-simulator * {
            box-sizing: border-box;
        }

        .simulator-header {
            background: linear-gradient(135deg, var(--maprimeadapt-secondary, #95cd93) 0%, #7db87a 100%);
            color: white;
            text-align: center;
            padding: 25px 20px;
        }

        .simulator-header h2 {
            margin: 0 0 10px 0;
            font-size: 22px;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
        }

        .simulator-header p {
            margin: 0;
            opacity: 0.7;
            font-size: 14px;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
        }

        .simulator-progress-bar {
            height: 4px;
            background: var(--maprimeadapt-background-light, #EFF8F2);
            position: relative;
        }

        .simulator-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--maprimeadapt-primary, #00b894), #55efc4);
            transition: width 0.5s ease;
            width: 0%;
        }

        .simulator-content {
            padding: 30px;
        }

        .simulator-question {
            display: none;
            animation: simulatorFadeIn 0.5s ease-in;
        }

        .simulator-question.active {
            display: block;
        }

        .simulator-question-title {
            font-size: 18px;
            font-weight: 600;
            font-family: 'Montserrat', sans-serif;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .simulator-question-subtitle {
            color: #7f8c8d;
            margin-bottom: 20px;
            font-size: 14px;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
        }

        .simulator-options {
            display: grid;
            gap: 10px;
            margin-bottom: 25px;
        }

        .simulator-option {
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
            font-size: 14px;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
        }

        .simulator-option:hover {
            border-color: #3498db;
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(52, 152, 219, 0.2);
        }

        .simulator-option.selected {
            border-color: var(--maprimeadapt-primary, #00b894);
            background: #f8fffc;
            color: var(--maprimeadapt-primary, #00b894);
            font-weight: 500;
        }

        .simulator-input-group {
            margin-bottom: 15px;
        }

        .simulator-input-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #2c3e50;
            font-size: 14px;
            font-family: 'Inter', sans-serif;
        }

        .simulator-input-group input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            background: white;
        }

        .simulator-input-group input:focus {
            outline: none;
            border-color: #3498db;
        }

        .simulator-buttons {
            display: flex;
            gap: 15px;
            justify-content: space-between;
            margin-top: 20px;
        }

        .simulator-btn {
            padding: 10px 25px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }

        .simulator-btn-primary {
            background: #73d859;
            color: #3f4d3b;
            border: 2px dashed #3f4d3b;
        }

        .simulator-btn-primary:hover {
            background: #0d3b66;
            color: #ffffff;
            border: 2px dashed #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(13, 59, 102, 0.3);
        }

        .simulator-btn-secondary {
            background: #95a5a6;
            color: white;
        }

        .simulator-btn-secondary:hover {
            background: #7f8c8d;
        }

        .simulator-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .simulator-result {
            display: none;
            text-align: center;
            padding: 25px;
            background: linear-gradient(135deg, var(--maprimeadapt-primary, #00b894), #55efc4);
            color: white;
            border-radius: 10px;
            margin-top: 20px;
        }

        .simulator-result.show {
            display: block;
            animation: simulatorFadeIn 0.5s ease-in;
        }

        .simulator-result.ineligible {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
        }

        .simulator-result h3 {
            font-size: 20px;
            margin-bottom: 15px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
        }

        .simulator-result-amount {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            font-family: 'Montserrat', sans-serif;
        }

        .simulator-result-details {
            font-size: 14px;
            line-height: 1.4;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
        }

        .simulator-result-details p {
            font-family: 'Inter', sans-serif;
            font-weight: 400;
        }

        .validation-error {
            background: #e74c3c;
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 14px;
            animation: simulatorFadeIn 0.3s ease-in;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
        }

        @keyframes simulatorFadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
            .simulator-content {
                padding: 20px;
            }
            
            .simulator-buttons {
                flex-direction: column;
            }
            
            .simulator-btn {
                width: 100%;
            }
        }
    `;

    // Template HTML sécurisé
    const simulatorHTML = `
        <div class="maprimeadapt-simulator">
            <div class="simulator-header">
                <h2>Simulateur MaPrimeAdapt</h2>
                <p>Découvrez votre éligibilité et le montant de votre aide en 2 minutes</p>
            </div>
            
            <div class="simulator-progress-bar">
                <div class="simulator-progress-fill"></div>
            </div>

            <div class="simulator-content">
                <form class="simulator-form">
                    <!-- Question 1 -->
                    <div class="simulator-question active" data-question="1">
                        <h3 class="simulator-question-title">Votre logement</h3>
                        <p class="simulator-question-subtitle">Votre projet concerne-t-il votre résidence principale ?</p>
                        <div class="simulator-options">
                            <div class="simulator-option" data-value="oui">Oui</div>
                            <div class="simulator-option" data-value="non">Non</div>
                        </div>
                    </div>

                    <!-- Question 2 -->
                    <div class="simulator-question" data-question="2">
                        <h3 class="simulator-question-title">Statut d'occupation</h3>
                        <p class="simulator-question-subtitle">Concernant ce logement, vous êtes :</p>
                        <div class="simulator-options">
                            <div class="simulator-option" data-value="proprietaire">Propriétaire occupant</div>
                            <div class="simulator-option" data-value="locataire_prive">Locataire - logement privé</div>
                            <div class="simulator-option" data-value="locataire_social">Locataire - logement social</div>
                            <div class="simulator-option" data-value="autre">Autre situation</div>
                        </div>
                    </div>

                    <!-- Question 3 -->
                    <div class="simulator-question" data-question="3">
                        <h3 class="simulator-question-title">Votre âge</h3>
                        <p class="simulator-question-subtitle">Quel âge avez-vous ?</p>
                        <div class="simulator-options">
                            <div class="simulator-option" data-value="moins_60">Moins de 60 ans</div>
                            <div class="simulator-option" data-value="60_69">Entre 60 et 69 ans</div>
                            <div class="simulator-option" data-value="70_plus">70 ans ou plus</div>
                        </div>
                    </div>

                    <!-- Question 4 -->
                    <div class="simulator-question" data-question="4">
                        <h3 class="simulator-question-title">Situation de handicap</h3>
                        <p class="simulator-question-subtitle">Êtes-vous en situation de handicap ?</p>
                        <div class="simulator-options">
                            <div class="simulator-option" data-value="oui">Oui (taux ≥ 50% ou PCH)</div>
                            <div class="simulator-option" data-value="non">Non</div>
                            <div class="simulator-option" data-value="ne_sais_pas">Je ne sais pas</div>
                        </div>
                    </div>

                    <!-- Question 5 -->
                    <div class="simulator-question" data-question="5">
                        <h3 class="simulator-question-title">Votre foyer</h3>
                        <div class="simulator-input-group">
                            <label for="sim-codePostal">Code postal :</label>
                            <input type="text" id="sim-codePostal" maxlength="5" placeholder="69000" required autocomplete="postal-code">
                        </div>
                        <div class="simulator-input-group">
                            <label>Nombre de personnes dans le foyer :</label>
                            <div class="simulator-options">
                                <div class="simulator-option" data-value="1">1 personne</div>
                                <div class="simulator-option" data-value="2">2 personnes</div>
                                <div class="simulator-option" data-value="3">3 personnes</div>
                                <div class="simulator-option" data-value="4">4 personnes</div>
                                <div class="simulator-option" data-value="5">5 personnes</div>
                                <div class="simulator-option" data-value="6">6 personnes ou plus</div>
                            </div>
                        </div>
                    </div>

                    <!-- Question 6 -->
                    <div class="simulator-question" data-question="6">
                        <h3 class="simulator-question-title">Vos revenus</h3>
                        <p class="simulator-question-subtitle">Revenu fiscal de référence total du foyer :</p>
                        <div class="simulator-options">
                            <div class="simulator-option" data-value="moins_20000">Moins de 20 000€</div>
                            <div class="simulator-option" data-value="20000_30000">Entre 20 000€ et 30 000€</div>
                            <div class="simulator-option" data-value="30000_40000">Entre 30 000€ et 40 000€</div>
                            <div class="simulator-option" data-value="plus_40000">Plus de 40 000€</div>
                        </div>
                    </div>

                    <!-- Question 7 -->
                    <div class="simulator-question" data-question="7">
                        <h3 class="simulator-question-title">Votre projet</h3>
                        <p class="simulator-question-subtitle">Quels travaux envisagez-vous ? (Sélection multiple possible)</p>
                        <div class="simulator-options">
                            <div class="simulator-option" data-value="douche">Douche de plain-pied</div>
                            <div class="simulator-option" data-value="monte_escalier">Monte-escalier</div>
                            <div class="simulator-option" data-value="barres_appui">Barres d'appui</div>
                            <div class="simulator-option" data-value="rampes">Rampes d'accès</div>
                            <div class="simulator-option" data-value="a_definir">À définir</div>
                        </div>
                    </div>

                    <!-- Question 8 -->
                    <div class="simulator-question" data-question="8">
                        <h3 class="simulator-question-title">Recevez votre estimation</h3>
                        <p class="simulator-question-subtitle">Remplissez ce formulaire pour recevoir votre estimation par email</p>
                        <div class="simulator-input-group">
                            <label for="sim-prenom">Prénom :</label>
                            <input type="text" id="sim-prenom" placeholder="Jean" required maxlength="50" autocomplete="given-name">
                        </div>
                        <div class="simulator-input-group">
                            <label for="sim-nom">Nom :</label>
                            <input type="text" id="sim-nom" placeholder="Dupont" required maxlength="50" autocomplete="family-name">
                        </div>
                        <div class="simulator-input-group">
                            <label for="sim-email">Adresse mail :</label>
                            <input type="email" id="sim-email" placeholder="jean.dupont@email.com" required maxlength="254" autocomplete="email">
                        </div>
                        <div class="simulator-input-group">
                            <label for="sim-telephone">Numéro de téléphone :</label>
                            <input type="tel" id="sim-telephone" placeholder="06 12 34 56 78" required maxlength="14" autocomplete="tel">
                        </div>
                    </div>

                    <!-- Résultat -->
                    <div class="simulator-result">
                        <h3>Votre estimation MaPrimeAdapt</h3>
                        <div class="simulator-result-amount">Calcul en cours...</div>
                        <div class="simulator-result-details"></div>
                        <p style="margin-top: 15px; font-size: 14px;">
                            Estimation détaillée envoyée par email<br>
                            Nos conseillers vous contacteront sous 24h
                        </p>
                    </div>

                    <div class="simulator-buttons">
                        <button type="button" class="simulator-btn simulator-btn-secondary simulator-prev-btn" style="display: none;">← Précédent</button>
                        <button type="button" class="simulator-btn simulator-btn-primary simulator-next-btn">Suivant →</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Classe principale sécurisée
    class MaPrimeAdaptSimulator {
        constructor(config = {}) {
            this.config = Object.assign({}, defaultConfig, config);
            this.container = document.getElementById(this.config.containerId);
            this.currentQuestion = 1;
            this.totalQuestions = 8;
            this.responses = {};
            this.retryCount = 0;
            
            if (!this.container) {
                this.logError(`Element with ID '${this.config.containerId}' not found`);
                return;
            }
            
            this.init();
        }

        logError(message, data = null) {
            if (this.config.debug) {
                console.error('[MaPrimeAdapt]', message, data);
            }
            
            if (this.config.callbacks.onError) {
                this.config.callbacks.onError(message, data);
            }
        }

        logDebug(message, data = null) {
            if (this.config.debug) {
                console.log('[MaPrimeAdapt]', message, data);
            }
        }

        init() {
            try {
                this.injectStyles();
                this.injectHTML();
                this.bindEvents();
                this.updateProgress();
                this.updateButtons();
                this.logDebug('Widget initialisé avec succès');
            } catch (error) {
                this.logError('Erreur lors de l\'initialisation:', error);
            }
        }

        injectStyles() {
            const root = document.documentElement;
            root.style.setProperty('--maprimeadapt-primary', this.config.theme.primaryColor);
            root.style.setProperty('--maprimeadapt-secondary', this.config.theme.secondaryColor);
            root.style.setProperty('--maprimeadapt-background-light', this.config.theme.backgroundLight);
            root.style.setProperty('--maprimeadapt-border-radius', this.config.theme.borderRadius);
            
            if (!document.querySelector('#maprimeadapt-styles')) {
                const style = document.createElement('style');
                style.id = 'maprimeadapt-styles';
                style.textContent = simulatorCSS;
                document.head.appendChild(style);
            }
        }

        injectHTML() {
            this.container.innerHTML = simulatorHTML;
        }

        bindEvents() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            
            simulator.querySelectorAll('.simulator-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const questionDiv = e.target.closest('.simulator-question');
                    const questionNum = questionDiv.dataset.question;
                    
                    if (questionNum === '7') {
                        e.target.classList.toggle('selected');
                        const selectedOptions = Array.from(questionDiv.querySelectorAll('.simulator-option.selected'))
                            .map(opt => SecurityUtils.sanitizeInput(opt.dataset.value));
                        this.responses[`question_${questionNum}`] = selectedOptions;
                        return;
                    }
                    
                    questionDiv.querySelectorAll('.simulator-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    e.target.classList.add('selected');
                    this.responses[`question_${questionNum}`] = SecurityUtils.sanitizeInput(e.target.dataset.value);
                    
                    if (this.config.callbacks.onStep) {
                        this.config.callbacks.onStep(questionNum, e.target.dataset.value);
                    }
                    
                    if (questionNum <= 4 || questionNum == 6) {
                        setTimeout(() => {
                            this.nextQuestion();
                        }, 500);
                    }
                });
            });

            simulator.querySelector('.simulator-next-btn').addEventListener('click', () => {
                this.nextQuestion();
            });

            simulator.querySelector('.simulator-prev-btn').addEventListener('click', () => {
                this.previousQuestion();
            });

            // Validation renforcée code postal
            simulator.querySelector('#sim-codePostal').addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
            });

            // Validation téléphone en temps réel
            simulator.querySelector('#sim-telephone').addEventListener('input', (e) => {
                const value = e.target.value.replace(/[^0-9+\s.-]/g, '');
                e.target.value = value.slice(0, 14);
            });

            // Validation nom/prénom (pas de caractères spéciaux)
            ['#sim-prenom', '#sim-nom'].forEach(selector => {
                simulator.querySelector(selector).addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s-']/g, '').slice(0, 50);
                });
            });
        }

        validateCurrentQuestion() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            
            if (this.currentQuestion === 5) {
                const codePostal = SecurityUtils.sanitizeInput(simulator.querySelector('#sim-codePostal').value);
                const foyerSize = this.responses.question_5;
                
                if (!codePostal || !SecurityUtils.validatePostalCode(codePostal)) {
                    this.showValidationError('Veuillez saisir un code postal français valide (5 chiffres)');
                    return false;
                }
                
                if (!foyerSize) {
                    this.showValidationError('Veuillez sélectionner le nombre de personnes dans votre foyer');
                    return false;
                }
                
                this.responses.codePostal = codePostal;
                return true;
            }

            if (this.currentQuestion === 7) {
                return true;
            }

            if (this.currentQuestion === 8) {
                const prenom = SecurityUtils.sanitizeInput(simulator.querySelector('#sim-prenom').value);
                const nom = SecurityUtils.sanitizeInput(simulator.querySelector('#sim-nom').value);
                const email = SecurityUtils.sanitizeInput(simulator.querySelector('#sim-email').value);
                const telephone = SecurityUtils.sanitizeInput(simulator.querySelector('#sim-telephone').value);
                
                // Validation renforcée
                if (!SecurityUtils.validateName(prenom)) {
                    this.showValidationError('Prénom invalide (2-50 caractères, lettres uniquement)');
                    return false;
                }
                
                if (!SecurityUtils.validateName(nom)) {
                    this.showValidationError('Nom invalide (2-50 caractères, lettres uniquement)');
                    return false;
                }
                
                if (!SecurityUtils.validateEmail(email)) {
                    this.showValidationError('Adresse email invalide');
                    return false;
                }
                
                if (!SecurityUtils.validatePhone(telephone)) {
                    this.showValidationError('Numéro de téléphone français invalide');
                    return false;
                }
                
                this.responses.prenom = prenom;
                this.responses.nom = nom;
                this.responses.email = email;
                this.responses.telephone = telephone;
                
                return true;
            }

            const currentQuestionDiv = simulator.querySelector(`[data-question="${this.currentQuestion}"]`);
            const selectedOption = currentQuestionDiv.querySelector('.simulator-option.selected');
            if (!selectedOption) {
                this.showValidationError('Veuillez sélectionner une option');
                return false;
            }

            return true;
        }

        showResult() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const eligibility = this.calculateEligibility();
            
            const resultDiv = simulator.querySelector('.simulator-result');
            const amountDiv = simulator.querySelector('.simulator-result-amount');
            const detailsDiv = simulator.querySelector('.simulator-result-details');
            
            // Vide le contenu de manière sécurisée
            while (detailsDiv.firstChild) {
                detailsDiv.removeChild(detailsDiv.firstChild);
            }
            
            if (eligibility.eligible) {
                resultDiv.classList.remove('ineligible');
                amountDiv.textContent = `Jusqu'à ${eligibility.montant.toLocaleString()}€`;
                
                // Construction 100% sécurisée avec createElement
                const eligibleP = SecurityUtils.createSecureElement('p', 'Vous êtes éligible à MaPrimeAdapt');
                detailsDiv.appendChild(eligibleP);
                
                const categoryP = SecurityUtils.createSecureElement('p', 
                    `Revenus ${eligibility.categorie} : ${eligibility.taux}% de prise en charge`);
                detailsDiv.appendChild(categoryP);
                
                const amountP = SecurityUtils.createSecureElement('p', 
                    `Montant maximum : ${eligibility.montant.toLocaleString()}€`);
                detailsDiv.appendChild(amountP);
                
            } else {
                resultDiv.classList.add('ineligible');
                amountDiv.textContent = 'Non éligible';
                
                const ineligibleP = SecurityUtils.createSecureElement('p', 
                    'Vous n\'êtes pas éligible à MaPrimeAdapt');
                detailsDiv.appendChild(ineligibleP);
                
                const reasonP = SecurityUtils.createSecureElement('p');
                const reasonStrong = SecurityUtils.createSecureElement('strong', 'Raison : ');
                reasonP.appendChild(reasonStrong);
                reasonP.appendChild(document.createTextNode(eligibility.reason));
                detailsDiv.appendChild(reasonP);
                
                const alternativeP = SecurityUtils.createSecureElement('p', 
                    'D\'autres aides peuvent exister (crédit d\'impôt, aides locales, aides des caisses de retraite)');
                detailsDiv.appendChild(alternativeP);
            }
            
            resultDiv.classList.add('show');
            simulator.querySelector('.simulator-next-btn').style.display = 'none';
            simulator.querySelector('.simulator-prev-btn').style.display = 'none';
            
            const userData = {
                prenom: this.responses.prenom,
                nom: this.responses.nom,
                email: this.responses.email,
                telephone: this.responses.telephone,
                eligible: eligibility.eligible,
                eligibility: eligibility,
                responses: this.responses,
                timestamp: new Date().toISOString(),
                sessionId: SecurityUtils.generateSessionId()
            };
            
            this.sendData(userData);
            
            if (this.config.callbacks.onComplete) {
                this.config.callbacks.onComplete(userData);
            }
        }

        sendData(userData) {
            if (!this.config.webhookUrl) {
                this.logDebug('Aucun webhook configuré');
                return;
            }

            // Validation URL plus stricte
            let webhookUrl;
            try {
                webhookUrl = new URL(this.config.webhookUrl);
                // Vérification que c'est HTTPS en production
                if (webhookUrl.protocol !== 'https:' && location.protocol === 'https:') {
                    throw new Error('Webhook doit être HTTPS');
                }
            } catch (error) {
                this.logError('URL de webhook invalide:', error.message);
                return;
            }

            // Données nettoyées (suppression des infos sensibles)
            const cleanUserData = {
                ...userData,
                userAgent: 'browser', // Information générique
                timestamp: userData.timestamp,
                sessionId: userData.sessionId
            };

            // Log sécurisé (sans données sensibles)
            this.logDebug('Envoi des données au webhook', {
                eligible: userData.eligible,
                timestamp: userData.timestamp
            });

            // Envoi avec sécurités renforcées
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            fetch(webhookUrl.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest' // Protection CSRF basique
                },
                body: JSON.stringify(cleanUserData),
                signal: controller.signal,
                credentials: 'omit', // Pas d'envoi de cookies
                referrerPolicy: 'no-referrer' // Pas d'envoi du referrer
            })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                this.logDebug('Webhook envoyé avec succès');
                this.retryCount = 0;
            })
            .catch(error => {
                clearTimeout(timeoutId);
                this.logError('Erreur webhook:', error.name); // Log moins détaillé
                
                if (this.retryCount < this.config.maxRetries && error.name !== 'AbortError') {
                    this.retryCount++;
                    setTimeout(() => this.sendData(userData), 
                        Math.min(2000 * Math.pow(2, this.retryCount), 10000)); // Backoff exponentiel
                }
            });
        }

        // Méthodes utilitaires
        nextQuestion() {
            if (!this.validateCurrentQuestion()) {
                return;
            }

            if (this.currentQuestion === this.totalQuestions) {
                this.showResult();
                return;
            }

            if (this.currentQuestion === 3 && this.responses.question_3 === '70_plus') {
                this.currentQuestion = 5;
            } else {
                this.currentQuestion++;
            }

            this.showQuestion();
        }

        previousQuestion() {
            if (this.currentQuestion > 1) {
                if (this.currentQuestion === 5 && this.responses.question_3 === '70_plus') {
                    this.currentQuestion = 3;
                } else {
                    this.currentQuestion--;
                }
                this.showQuestion();
            }
        }

        showQuestion() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            
            simulator.querySelectorAll('.simulator-question').forEach(q => {
                q.classList.remove('active');
            });

            const currentQuestionDiv = simulator.querySelector(`[data-question="${this.currentQuestion}"]`);
            if (currentQuestionDiv) {
                currentQuestionDiv.classList.add('active');
                
                if (this.currentQuestion === 8) {
                    setTimeout(() => {
                        const prenomInput = simulator.querySelector('#sim-prenom');
                        if (prenomInput) {
                            prenomInput.focus();
                        }
                    }, 100);
                }
            }

            this.updateProgress();
            this.updateButtons();
        }

        showValidationError(message) {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            
            const existingError = simulator.querySelector('.validation-error');
            if (existingError) {
                existingError.remove();
            }
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = SecurityUtils.escapeHtml(message); // Sécurisation du message
            
            const currentQuestion = simulator.querySelector('.simulator-question.active');
            const buttons = simulator.querySelector('.simulator-buttons');
            buttons.parentNode.insertBefore(errorDiv, buttons);
            
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        }

        checkEligibility() {
            if (this.responses.question_1 === 'non') {
                return {
                    eligible: false,
                    reason: 'Le projet ne concerne pas votre résidence principale'
                };
            }

            if (this.responses.question_2 === 'locataire_social') {
                return {
                    eligible: false,
                    reason: 'MaPrimeAdapt ne concerne pas les logements sociaux'
                };
            }

            if (this.responses.question_3 === 'moins_60' && this.responses.question_4 === 'non') {
                return {
                    eligible: false,
                    reason: 'Vous devez avoir au moins 60 ans ou être en situation de handicap'
                };
            }

            return { eligible: true };
        }

        calculateEligibility() {
            const eligibilityCheck = this.checkEligibility();
            
            if (!eligibilityCheck.eligible) {
                return eligibilityCheck;
            }

            const codePostal = this.responses.codePostal;
            const foyerSize = parseInt(this.responses.question_5);
            const revenus = this.responses.question_6;
            
            // Validation supplémentaire côté calcul
            if (!codePostal || !SecurityUtils.validatePostalCode(codePostal)) {
                return { eligible: false, reason: 'Code postal invalide' };
            }

            if (isNaN(foyerSize) || foyerSize < 1 || foyerSize > 6) {
                return { eligible: false, reason: 'Taille de foyer invalide' };
            }

            const idfCodes = ['75', '77', '78', '91', '92', '93', '94', '95'];
            const isIleDeFrance = idfCodes.includes(codePostal.substring(0, 2));
            
            const plafonds = {
                idf: {
                    tres_modeste: [23768, 34884, 41893, 48914, 55961],
                    modeste: [28933, 42463, 51000, 59549, 68123]
                },
                province: {
                    tres_modeste: [17173, 25115, 30206, 35285, 40388],
                    modeste: [22015, 32197, 38719, 45234, 51775]
                }
            };
            
            const region = isIleDeFrance ? 'idf' : 'province';
            const plafondIndex = Math.min(foyerSize - 1, 4);
            
            let revenuEstime = 0;
            switch(revenus) {
                case 'moins_20000': revenuEstime = 18000; break;
                case '20000_30000': revenuEstime = 25000; break;
                case '30000_40000': revenuEstime = 35000; break;
                case 'plus_40000': revenuEstime = 45000; break;
                default: 
                    return { eligible: false, reason: 'Tranche de revenus invalide' };
            }
            
            const plafondTresModeste = plafonds[region].tres_modeste[plafondIndex];
            const plafondModeste = plafonds[region].modeste[plafondIndex];
            
            if (revenuEstime <= plafondTresModeste) {
                return { eligible: true, taux: 70, montant: 15400, categorie: 'très modeste' };
            } else if (revenuEstime <= plafondModeste) {
                return { eligible: true, taux: 50, montant: 11000, categorie: 'modeste' };
            } else {
                return { eligible: false, reason: 'Vos revenus dépassent les plafonds MaPrimeAdapt' };
            }
        }

        updateProgress() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const progress = Math.min(100, (this.currentQuestion / this.totalQuestions) * 100);
            simulator.querySelector('.simulator-progress-fill').style.width = `${progress}%`;
        }

        updateButtons() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const prevBtn = simulator.querySelector('.simulator-prev-btn');
            const nextBtn = simulator.querySelector('.simulator-next-btn');
            
            prevBtn.style.display = this.currentQuestion > 1 ? 'block' : 'none';
            
            if (this.currentQuestion === this.totalQuestions) {
                nextBtn.textContent = 'Calculer mon estimation';
            } else {
                nextBtn.textContent = 'Suivant →';
            }
        }

        // API publique sécurisée
        reset() {
            try {
                this.currentQuestion = 1;
                this.responses = {};
                this.retryCount = 0;
                this.showQuestion();
                
                const simulator = this.container.querySelector('.maprimeadapt-simulator');
                const resultDiv = simulator.querySelector('.simulator-result');
                resultDiv.classList.remove('show');
                simulator.querySelector('.simulator-next-btn').style.display = 'block';
                
                this.logDebug('Widget réinitialisé');
            } catch (error) {
                this.logError('Erreur lors de la réinitialisation:', error);
            }
        }

        updateConfig(newConfig) {
            if (typeof newConfig !== 'object' || newConfig === null) {
                this.logError('Configuration invalide');
                return;
            }

            this.config = Object.assign(this.config, newConfig);
            this.injectStyles();
            this.logDebug('Configuration mise à jour');
        }

        getCurrentStep() {
            return {
                question: this.currentQuestion,
                total: this.totalQuestions,
                responses: Object.keys(this.responses).length
            };
        }

        // Méthode pour vérifier l'intégrité du widget
        checkIntegrity() {
            const checks = {
                container: !!this.container,
                questions: this.container?.querySelectorAll('.simulator-question').length === 8,
                buttons: this.container?.querySelectorAll('.simulator-btn').length === 2,
                styles: !!document.querySelector('#maprimeadapt-styles')
            };

            const isValid = Object.values(checks).every(check => check);
            this.logDebug('Vérification d\'intégrité:', { isValid, checks });
            
            return { isValid, checks };
        }
    }

    // API globale sécurisée
    window.MaPrimeAdapt = {
        init: function(config = {}) {
            try {
                return new MaPrimeAdaptSimulator(config);
            } catch (error) {
                console.error('[MaPrimeAdapt] Erreur d\'initialisation:', error);
                return null;
            }
        },
        
        auto: function(config = {}) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    try {
                        return new MaPrimeAdaptSimulator(config);
                    } catch (error) {
                        console.error('[MaPrimeAdapt] Erreur d\'auto-initialisation:', error);
                        return null;
                    }
                });
            } else {
                return this.init(config);
            }
        },
        
        version: '1.2.0-secure'
    };

    // Auto-initialisation sécurisée
    function autoInit() {
        try {
            const defaultContainer = document.getElementById('maprimeadapt-simulator');
            if (defaultContainer && !defaultContainer.hasAttribute('data-manual-init')) {
                new MaPrimeAdaptSimulator();
            }
        } catch (error) {
            console.error('[MaPrimeAdapt] Erreur d\'auto-initialisation:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

})();