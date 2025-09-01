// Widget MaPrimeAdapt Embeddable
// Version: 1.0.0
// Usage: <script src="maprimeadapt-widget.js"></script>
//        <div id="maprimeadapt-simulator"></div>

(function() {
    'use strict';

    // Configuration par défaut (peut être surchargée)
    const defaultConfig = {
        containerId: 'maprimeadapt-simulator',
        webhookUrl: null, // À configurer
        theme: {
            primaryColor: '#00b894',
            secondaryColor: '#95cd93',
            borderRadius: '15px'
        },
        callbacks: {
            onComplete: null,
            onStep: null
        }
    };

    // CSS du simulateur
    const simulatorCSS = `
        .maprimeadapt-simulator {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: var(--maprimeadapt-border-radius, 15px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            font-family: Arial, sans-serif;
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
            font-weight: bold;
        }

        .simulator-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
        }

        .simulator-progress-bar {
            height: 4px;
            background: #e0e0e0;
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
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .simulator-question-subtitle {
            color: #7f8c8d;
            margin-bottom: 20px;
            font-size: 14px;
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
            font-weight: bold;
        }

        .simulator-input-group {
            margin-bottom: 15px;
        }

        .simulator-input-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #2c3e50;
            font-size: 14px;
        }

        .simulator-input-group input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }

        .simulator-input-group input:focus {
            outline: none;
            border-color: #3498db;
        }

        .simulator-checkbox-group {
            display: flex;
            align-items: center;
            margin-top: 15px;
        }

        .simulator-checkbox-group input[type="checkbox"] {
            width: auto;
            margin-right: 8px;
        }

        .simulator-checkbox-group label {
            font-size: 14px;
            font-weight: normal;
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
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .simulator-btn-primary {
            background: linear-gradient(135deg, var(--maprimeadapt-primary, #00b894), #55efc4);
            color: white;
        }

        .simulator-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 184, 148, 0.3);
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
        }

        .simulator-result-amount {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .simulator-result-details {
            font-size: 14px;
            line-height: 1.4;
        }

        .validation-error {
            background: #e74c3c;
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 14px;
            animation: simulatorFadeIn 0.3s ease-in;
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

    // Template HTML du simulateur
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
                            <input type="text" id="sim-codePostal" maxlength="5" placeholder="69000" required>
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
                            <input type="text" id="sim-prenom" placeholder="Jean" required>
                        </div>
                        <div class="simulator-input-group">
                            <label for="sim-nom">Nom :</label>
                            <input type="text" id="sim-nom" placeholder="Dupont" required>
                        </div>
                        <div class="simulator-input-group">
                            <label for="sim-email">Adresse mail :</label>
                            <input type="email" id="sim-email" placeholder="jean.dupont@email.com" required>
                        </div>
                        <div class="simulator-input-group">
                            <label for="sim-telephone">Numéro de téléphone :</label>
                            <input type="tel" id="sim-telephone" placeholder="06 12 34 56 78" required>
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

    // Classe principale du simulateur
    class MaPrimeAdaptSimulator {
        constructor(config = {}) {
            this.config = Object.assign({}, defaultConfig, config);
            this.container = document.getElementById(this.config.containerId);
            this.currentQuestion = 1;
            this.totalQuestions = 8;
            this.responses = {};
            
            if (!this.container) {
                console.error(`Element with ID '${this.config.containerId}' not found`);
                return;
            }
            
            this.init();
        }

        init() {
            this.injectStyles();
            this.injectHTML();
            this.bindEvents();
            this.updateProgress();
            this.updateButtons();
        }

        injectStyles() {
            // Inject CSS variables for theming
            const root = document.documentElement;
            root.style.setProperty('--maprimeadapt-primary', this.config.theme.primaryColor);
            root.style.setProperty('--maprimeadapt-secondary', this.config.theme.secondaryColor);
            root.style.setProperty('--maprimeadapt-border-radius', this.config.theme.borderRadius);
            
            // Inject CSS if not already present
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
            
            // Options selection
            simulator.querySelectorAll('.simulator-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const questionDiv = e.target.closest('.simulator-question');
                    const questionNum = questionDiv.dataset.question;
                    
                    // Special handling for question 7 (multiple selection)
                    if (questionNum === '7') {
                        e.target.classList.toggle('selected');
                        const selectedOptions = Array.from(questionDiv.querySelectorAll('.simulator-option.selected'))
                            .map(opt => opt.dataset.value);
                        this.responses[`question_${questionNum}`] = selectedOptions;
                        return;
                    }
                    
                    // Regular single selection
                    questionDiv.querySelectorAll('.simulator-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    e.target.classList.add('selected');
                    this.responses[`question_${questionNum}`] = e.target.dataset.value;
                    
                    // Trigger step callback
                    if (this.config.callbacks.onStep) {
                        this.config.callbacks.onStep(questionNum, e.target.dataset.value);
                    }
                    
                    // Auto-advance for some questions
                    if (questionNum <= 4 || questionNum == 6) {
                        setTimeout(() => {
                            this.nextQuestion();
                        }, 500);
                    }
                });
            });

            // Navigation buttons
            simulator.querySelector('.simulator-next-btn').addEventListener('click', () => {
                this.nextQuestion();
            });

            simulator.querySelector('.simulator-prev-btn').addEventListener('click', () => {
                this.previousQuestion();
            });

            // Code postal validation
            simulator.querySelector('#sim-codePostal').addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }

        nextQuestion() {
            if (!this.validateCurrentQuestion()) {
                return;
            }

            if (this.currentQuestion === this.totalQuestions) {
                this.showResult();
                return;
            }

            // Skip handicap question if 70+
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

        validateCurrentQuestion() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            
            if (this.currentQuestion === 5) {
                const codePostal = simulator.querySelector('#sim-codePostal').value;
                const foyerSize = this.responses.question_5;
                
                if (!codePostal || codePostal.length !== 5) {
                    this.showValidationError('Veuillez saisir un code postal valide (5 chiffres)');
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
                return true; // Optional question
            }

            if (this.currentQuestion === 8) {
                const prenom = simulator.querySelector('#sim-prenom').value;
                const nom = simulator.querySelector('#sim-nom').value;
                const email = simulator.querySelector('#sim-email').value;
                const telephone = simulator.querySelector('#sim-telephone').value;
                
                if (!prenom || !nom || !email || !telephone) {
                    this.showValidationError('Veuillez remplir tous les champs obligatoires');
                    return false;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.showValidationError('Veuillez saisir une adresse email valide');
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

        showValidationError(message) {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            
            const existingError = simulator.querySelector('.validation-error');
            if (existingError) {
                existingError.remove();
            }
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = message;
            
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

        showResult() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const eligibility = this.calculateEligibility();
            
            const resultDiv = simulator.querySelector('.simulator-result');
            const amountDiv = simulator.querySelector('.simulator-result-amount');
            const detailsDiv = simulator.querySelector('.simulator-result-details');
            
            if (eligibility.eligible) {
                resultDiv.classList.remove('ineligible');
                amountDiv.innerHTML = `Jusqu'à ${eligibility.montant.toLocaleString()}€`;
                detailsDiv.innerHTML = `
                    <p>Vous êtes éligible à MaPrimeAdapt</p>
                    <p>Revenus ${eligibility.categorie} : ${eligibility.taux}% de prise en charge</p>
                    <p>Montant maximum : ${eligibility.montant.toLocaleString()}€</p>
                `;
            } else {
                resultDiv.classList.add('ineligible');
                amountDiv.innerHTML = `Non éligible`;
                detailsDiv.innerHTML = `
                    <p>Vous n'êtes pas éligible à MaPrimeAdapt</p>
                    <p><strong>Raison :</strong> ${eligibility.reason}</p>
                    <p>D'autres aides peuvent exister (crédit d'impôt, aides locales, aides des caisses de retraite)</p>
                `;
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
                timestamp: new Date().toISOString()
            };
            
            this.sendData(userData);
            
            // Trigger completion callback
            if (this.config.callbacks.onComplete) {
                this.config.callbacks.onComplete(userData);
            }
        }

        sendData(userData) {
            console.log('Données du simulateur:', userData);
            
            if (this.config.webhookUrl) {
                fetch(this.config.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur réseau');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Webhook envoyé avec succès:', data);
                })
                .catch(error => {
                    console.error('Erreur lors de l\'envoi du webhook:', error);
                });
            }
        }

        updateProgress() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const progress = (this.currentQuestion / this.totalQuestions) * 100;
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

        // Méthodes publiques pour l'API
        reset() {
            this.currentQuestion = 1;
            this.responses = {};
            this.showQuestion();
            
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const resultDiv = simulator.querySelector('.simulator-result');
            resultDiv.classList.remove('show');
            simulator.querySelector('.simulator-next-btn').style.display = 'block';
        }

        updateConfig(newConfig) {
            this.config = Object.assign(this.config, newConfig);
            this.injectStyles(); // Re-inject styles with new theme
        }

        getCurrentStep() {
            return {
                question: this.currentQuestion,
                total: this.totalQuestions,
                responses: this.responses
            };
        }
    }

    // API globale pour initialiser le simulateur
    window.MaPrimeAdapt = {
        init: function(config = {}) {
            return new MaPrimeAdaptSimulator(config);
        },
        
        // Version avec auto-initialisation
        auto: function(config = {}) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    return new MaPrimeAdaptSimulator(config);
                });
            } else {
                return new MaPrimeAdaptSimulator(config);
            }
        }
    };

    // Auto-initialisation si un élément avec l'ID par défaut existe
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const defaultContainer = document.getElementById('maprimeadapt-simulator');
            if (defaultContainer && !defaultContainer.hasAttribute('data-manual-init')) {
                new MaPrimeAdaptSimulator();
            }
        });
    } else {
        const defaultContainer = document.getElementById('maprimeadapt-simulator');
        if (defaultContainer && !defaultContainer.hasAttribute('data-manual-init')) {
            new MaPrimeAdaptSimulator();
        }
    }

})();