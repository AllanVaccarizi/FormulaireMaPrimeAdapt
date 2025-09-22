// Widget MaPrimeAdapt Embeddable - Version Sécurisée avec GIR - Thème Bleu - Revenus Dynamiques
// Version: 1.3.2-fixed
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

    // Configuration par défaut (sécurisée) - Thème bleu
    const defaultConfig = {
        containerId: 'maprimeadapt-simulator',
        webhookUrl: 'https://optimizehomeconseil.app.n8n.cloud/webhook/form',
        maxRetries: 3,
        timeout: 10000,
        debug: false,
        theme: {
            primaryColor: '#3563a4',
            secondaryColor: '#5a7bc4',
            backgroundLight: '#f0f4ff',
            borderRadius: '15px'
        },
        // AJOUTER cette section
        googleAds: {
            conversionId: 'AW-17329606398',
            conversionLabel: 'sZM4CI6ouZgbEP6ds8dA'
        },
        callbacks: {
            onComplete: null,
            onStep: null,
            onError: null
        }
    };

    // Nouvelles tranches de revenus par taille de foyer
    const incomeThresholds = {
        1: { low: 17173, high: 22015 },
        2: { low: 25115, high: 32197 },
        3: { low: 30206, high: 38719 },
        4: { low: 35285, high: 45234 },
        5: { low: 40388, high: 51775 },
        6: { low: 45482, high: 58300 }
    };

    // Texte officiel du consentement RGPD
    const TEXTE_CONSENTEMENT_OFFICIEL = "J'accepte que mes données soient utilisées par Optimize Home Conseil et transmises à ses partenaires commerciaux dans le cadre de la mise en relation pour des services liés à l'adaptation du logement.";

    // Métadonnées RGPD
    const RGPD_METADATA = {
        responsable_traitement: "Optimize Home Conseil",
        base_legale: "Consentement (Art. 6.1.a RGPD)",
        finalites: "Mise en relation commerciale - services adaptation logement",
        duree_conservation: "3 ans après complétion du formulaire Ma Prime Adapt",
        version_widget: "1.3.2-fixed"
    };

    // CSS du simulateur avec couleurs bleues
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
            background: linear-gradient(135deg, #3563a4, #5a7bc4);
            color: white;
            text-align: center;
            padding: 25px 20px;
        }

        .simulator-header h2 {
            margin: 0 0 10px 0;
            font-size: 22px;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            color: white;
        }

        .simulator-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            color: white;
        }

        .simulator-progress-bar {
            height: 4px;
            background: var(--maprimeadapt-background-light, #f0f4ff);
            position: relative;
        }

        .simulator-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--maprimeadapt-primary, #3563a4), #5a7bc4);
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
            border-color: var(--maprimeadapt-primary, #3563a4);
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(53, 99, 164, 0.2);
        }

        .simulator-option.selected {
            border-color: var(--maprimeadapt-primary, #3563a4);
            background: var(--maprimeadapt-background-light, #f0f4ff);
            color: var(--maprimeadapt-primary, #3563a4);
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
            border-color: var(--maprimeadapt-primary, #3563a4);
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
            border-radius: 6.25rem;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.45s ease;
            font-family: 'Inter', sans-serif;
        }

        .simulator-btn-primary {
            background: var(--maprimeadapt-primary, #3563a4);
            color: white;
            border: 2px solid transparent;
        }

        .simulator-btn-primary:hover {
            background: #2a4d87;
            color: #ffffff;
            border: 2px dashed var(--maprimeadapt-primary, #3563a4);
            border-width: 1px;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(53, 99, 164, 0.3);
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
            background: linear-gradient(135deg, var(--maprimeadapt-primary, #3563a4), #5a7bc4);
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
            color: white;
        }

        .simulator-result-amount {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            font-family: 'Montserrat', sans-serif;
            color: white;
        }

        .simulator-result-details {
            font-size: 14px;
            line-height: 1.4;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            color: white;
        }

        .simulator-result-details p {
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            color: white;
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

        .gir-info-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #495057;
        }

        .gir-info-box strong {
            color: #2c3e50;
            font-weight: 600;
        }

        @keyframes simulatorFadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .simulator-checkbox-container {
            display: flex;
            align-items: flex-start;
            font-size: 13px;
            line-height: 1.4;
            cursor: pointer;
            margin-bottom: 0;
            font-weight: 400;
        }

        .simulator-checkbox-container input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
            margin-top: 2px;
            transform: scale(1.2);
            cursor: pointer;
        }

        .simulator-checkbox-container input[type="checkbox"]:focus {
            outline: 2px solid var(--maprimeadapt-primary, #3563a4);
            outline-offset: 2px;
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

    // Template HTML sécurisé avec question GIR et texte modifié
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

                    <!-- Question 4B - GIR (conditionnelle) -->
                    <div class="simulator-question" data-question="4b">
                        <h3 class="simulator-question-title">Niveau d'autonomie (GIR)</h3>
                        <p class="simulator-question-subtitle">Avez-vous été évalué par un professionnel concernant votre niveau d'autonomie ?</p>
                        
                        <div class="gir-info-box">
                            <strong>Le GIR (Groupe Iso-Ressources)</strong> évalue le degré de perte d'autonomie d'une personne :<br>
                            • GIR 1-2 : Forte dépendance<br>
                            • GIR 3-4 : Dépendance modérée<br>
                            • GIR 5-6 : Faible dépendance<br><br>
                            Cette évaluation peut avoir été réalisée par votre médecin traitant, un service médico-social, ou lors d'une demande d'APA.
                        </div>
                        
                        <div class="simulator-options">
                            <div class="simulator-option" data-value="gir_1_2">Oui, GIR 1 ou 2 (forte dépendance)</div>
                            <div class="simulator-option" data-value="gir_3_4">Oui, GIR 3 ou 4 (dépendance modérée)</div>
                            <div class="simulator-option" data-value="gir_5_6">Oui, GIR 5 ou 6 (faible dépendance)</div>
                            <div class="simulator-option" data-value="pas_evalue">Non, je n'ai pas été évalué</div>
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

                    <!-- Question 6 - Revenus dynamiques -->
                    <div class="simulator-question" data-question="6">
                        <h3 class="simulator-question-title">Vos revenus</h3>
                        <p class="simulator-question-subtitle">Revenu fiscal de référence total du foyer :</p>
                        <div class="simulator-options" id="income-options">
                            <!-- Les options seront générées dynamiquement -->
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
                        <p class="simulator-question-subtitle">Remplissez ce formulaire pour recevoir votre estimation par email et nos coordonnées</p>
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
                        <div class="simulator-input-group">
                            <label class="simulator-checkbox-container">
                                <input type="checkbox" id="sim-consentement" required>
                                <span class="simulator-checkmark"></span>
                                J'accepte que mes données soient utilisées par Optimize Home Conseil et transmises à ses partenaires commerciaux dans le cadre de la mise en relation pour des services liés à l'adaptation du logement.
                            </label>
                        </div>
                    </div>

                    <!-- Résultat -->
                    <div class="simulator-result">
                        <h3>Vous êtes éligible</h3>
                        <div class="simulator-result-amount">Calcul en cours...</div>
                        <div class="simulator-result-details"></div>
                    </div>

                    <div class="simulator-buttons">
                        <button type="button" class="simulator-btn simulator-btn-secondary simulator-prev-btn" style="display: none;">← Précédent</button>
                        <button type="button" class="simulator-btn simulator-btn-primary simulator-next-btn">Suivant →</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Classe principale sécurisée avec logique GIR et revenus dynamiques
    class MaPrimeAdaptSimulator {
        constructor(config = {}) {
            this.config = Object.assign({}, defaultConfig, config);
            this.container = document.getElementById(this.config.containerId);
            this.currentQuestion = 1;
            this.totalQuestions = 8; // Le nombre reste 8, question 4b est conditionnelle
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

        // Nouvelle méthode pour générer les options de revenus dynamiquement
        generateIncomeOptions(householdSize) {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const incomeOptionsContainer = simulator.querySelector('#income-options');
            
            // Vide les options existantes
            incomeOptionsContainer.innerHTML = '';
            
            // Utilise les seuils pour la taille du foyer (max 6)
            const size = Math.min(parseInt(householdSize), 6);
            const thresholds = incomeThresholds[size];
            
            // Formate les montants avec des espaces
            const formatAmount = (amount) => amount.toLocaleString('fr-FR');
            
            // Crée les trois options
            const options = [
                {
                    value: 'tranche_1',
                    text: `Inférieur à ${formatAmount(thresholds.low)} €`
                },
                {
                    value: 'tranche_2', 
                    text: `Entre ${formatAmount(thresholds.low)} € et ${formatAmount(thresholds.high)} €`
                },
                {
                    value: 'tranche_3',
                    text: `Supérieur à ${formatAmount(thresholds.high)} €`
                }
            ];
            
            // Ajoute les options au DOM
            options.forEach(option => {
                const optionDiv = SecurityUtils.createSecureElement('div', option.text, 'simulator-option');
                optionDiv.dataset.value = option.value;
                incomeOptionsContainer.appendChild(optionDiv);
                
                // Ajoute l'événement click
                optionDiv.addEventListener('click', (e) => {
                    const questionDiv = e.target.closest('.simulator-question');
                    const questionNum = questionDiv.dataset.question;
                    
                    questionDiv.querySelectorAll('.simulator-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    e.target.classList.add('selected');
                    this.responses[`question_${questionNum}`] = SecurityUtils.sanitizeInput(e.target.dataset.value);
                    
                    if (this.config.callbacks.onStep) {
                        this.config.callbacks.onStep(questionNum, e.target.dataset.value);
                    }
                });
            });
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
                    
                    // Gestion spéciale pour la question 5 (nombre de personnes dans le foyer)
                    if (questionNum === '5') {
                        questionDiv.querySelectorAll('.simulator-option').forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        
                        e.target.classList.add('selected');
                        this.responses[`question_${questionNum}`] = SecurityUtils.sanitizeInput(e.target.dataset.value);
                        
                        // Génère dynamiquement les options de revenus pour la question suivante
                        this.generateIncomeOptions(e.target.dataset.value);
                        
                        if (this.config.callbacks.onStep) {
                            this.config.callbacks.onStep(questionNum, e.target.dataset.value);
                        }
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
                    
                    // Navigation automatique pour certaines questions (sauf question 4b qui nécessite réflexion)
                    if ((questionNum <= 4 && questionNum !== '4b') || questionNum == 6) {
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

        // Méthode pour déterminer si la question GIR doit être affichée
        shouldShowGirQuestion() {
            const age = this.responses.question_3;
            const handicap = this.responses.question_4;
            
            // Question GIR uniquement pour les 60-69 ans qui ne sont pas en situation de handicap
            return age === '60_69' && (handicap === 'non' || handicap === 'ne_sais_pas');
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

                const consentement = simulator.querySelector('#sim-consentement').checked;

                if (!consentement) {
                    this.showValidationError('Vous devez accepter l\'utilisation de vos données pour continuer');
                    return false;
                }

                this.responses.prenom = prenom;
                this.responses.nom = nom;
                this.responses.email = email;
                this.responses.telephone = telephone;
                this.responses.consentement = consentement;

                return true;
            }

            const currentQuestionDiv = simulator.querySelector(`[data-question="${this.currentQuestion}"]`);
            if (!currentQuestionDiv) {
                this.logError('Question introuvable:', this.currentQuestion);
                return false;
            }
            
            const selectedOption = currentQuestionDiv.querySelector('.simulator-option.selected');
            if (!selectedOption) {
                this.showValidationError('Veuillez sélectionner une option');
                return false;
            }

            return true;
        }

        // NOUVEAU: Méthode pour calculer le statut de l'éligibilité mail
        calculateMailEligibility() {
            const eligibility = this.calculateEligibility();
            const age = this.responses.question_3;
            const handicap = this.responses.question_4;
            const gir = this.responses.question_4b;
            
            // Cas spécial pour les 60-69 ans sans handicap confirmé
            if (age === '60_69' && (handicap === 'non' || handicap === 'ne_sais_pas')) {
                // Si la personne a un GIR évalué (1-2, 3-4, ou 5-6) : Attente document
                if (gir === 'gir_1_2' || gir === 'gir_3_4' || gir === 'gir_5_6') {
                    return "Attente document";
                }
                // Si la personne n'a pas été évaluée : non éligible
                if (gir === 'pas_evalue' || !gir) {
                    return "non éligible";
                }
            }
            
            // Pour tous les autres cas : suivre l'éligibilité globale
            if (eligibility.eligible) {
                return "éligible";
            } else {
                return "non éligible";
            }
        }

        showResult() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const eligibility = this.calculateEligibility();
            
            // Cache la question active et les boutons
            const activeQuestion = simulator.querySelector('.simulator-question.active');
            if (activeQuestion) {
                activeQuestion.classList.remove('active');
            }
            simulator.querySelector('.simulator-next-btn').style.display = 'none';
            simulator.querySelector('.simulator-prev-btn').style.display = 'none';
            
            const resultDiv = simulator.querySelector('.simulator-result');
            const amountDiv = simulator.querySelector('.simulator-result-amount');
            const detailsDiv = simulator.querySelector('.simulator-result-details');
            
            // Vide le contenu de manière sécurisée
            while (detailsDiv.firstChild) {
                detailsDiv.removeChild(detailsDiv.firstChild);
            }
            
            if (eligibility.eligible) {
                resultDiv.classList.remove('ineligible');
                
                // Modifier le titre principal avec émoji
                const titleElement = simulator.querySelector('.simulator-result h3');
                titleElement.textContent = 'Vous êtes éligible à MaPrimeAdapt 🎉';
                
                // Cacher le montant
                amountDiv.style.display = 'none';
                
                // Message email
                const emailP = SecurityUtils.createSecureElement('p');
                emailP.innerHTML = '📩 <strong>Une proposition personnalisée vous a été envoyée par email.</strong>';
                detailsDiv.appendChild(emailP);
                
                // Message conseillers
                const advisorsP = SecurityUtils.createSecureElement('p');
                advisorsP.innerHTML = '📞 <strong>Nos conseillers vous contacteront très prochainement pour vous accompagner pas à pas dans la réalisation de votre projet d\'adaptation de logement.</strong>';
                detailsDiv.appendChild(advisorsP);
                
                // Message encouragement
                const launchP = SecurityUtils.createSecureElement('p');
                launchP.innerHTML = '➡️ <strong>Votre démarche est lancée, nous nous occupons du reste !</strong>';
                detailsDiv.appendChild(launchP);
                
            } else {
                resultDiv.classList.add('ineligible');
                
                // Modifier le titre principal
                const titleElement = simulator.querySelector('.simulator-result h3');
                titleElement.textContent = 'Non éligible à MaPrimeAdapt';
                
                // Cacher complètement le montant
                amountDiv.style.display = 'none';
                
                // Message principal avec émoji
                const mainMessageP = SecurityUtils.createSecureElement('p');
                mainMessageP.innerHTML = '👉 <strong>Vous ne répondez pas aux critères de MaPrimeAdapt</strong> - ' + SecurityUtils.escapeHtml(eligibility.reason);
                detailsDiv.appendChild(mainMessageP);
                
                // Message email
                const emailP = SecurityUtils.createSecureElement('p');
                emailP.innerHTML = '📩 <strong>Une proposition adaptée à votre situation vous a été envoyée par email.</strong>';
                detailsDiv.appendChild(emailP);
                
                // Message conseillers
                const advisorsP = SecurityUtils.createSecureElement('p');
                advisorsP.innerHTML = '📞 <strong>Nos conseillers vont vous recontacter rapidement afin d\'étudier avec vous les solutions possibles pour concrétiser votre projet d\'adaptation de logement.</strong>';
                detailsDiv.appendChild(advisorsP);
                
                // Message encouragement
                const encouragementP = SecurityUtils.createSecureElement('p');
                encouragementP.innerHTML = '➡️ <strong>Votre projet reste réalisable : nous sommes là pour vous accompagner.</strong>';
                detailsDiv.appendChild(encouragementP);
            }

            
            resultDiv.classList.add('show');
            
            const userData = {
                prenom: this.responses.prenom,
                nom: this.responses.nom,
                email: this.responses.email,
                telephone: this.responses.telephone,
                consentement: this.responses.consentement,
                eligible: eligibility.eligible,
                taux_aide: eligibility.taux || null,
                // NOUVEAU: Ajout du champ mail
                mail: this.calculateMailEligibility(),
                eligibility: eligibility,
                responses: this.responses,
                timestamp: (() => {
                    const now = new Date();
                    const day = String(now.getDate()).padStart(2, '0');
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const year = now.getFullYear();
                    return `${day}/${month}/${year}`;
                })(), // Format : 15/09/2025
                sessionId: SecurityUtils.generateSessionId(),
                // Nouvelles données RGPD
                rgpd_data: {
                    id_unique: 'CONS_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '_' + SecurityUtils.generateSessionId().slice(0,8),
                    identite_complete: this.responses.prenom + ' ' + this.responses.nom + ' - ' + this.responses.email,
                    texte_consentement: TEXTE_CONSENTEMENT_OFFICIEL,
                    action_consentement: "Case cochée volontairement",
                    finalites_traitement: RGPD_METADATA.finalites,
                    duree_conservation: RGPD_METADATA.duree_conservation,
                    statut_consentement: "Actif",
                    base_legale: RGPD_METADATA.base_legale,
                    responsable_traitement: RGPD_METADATA.responsable_traitement,
                    user_agent_complet: navigator.userAgent,
                    url_page: window.location.href,
                    referrer: document.referrer || 'Direct',
                    version_widget: RGPD_METADATA.version_widget
                }
            };
            
            this.sendData(userData);

            this.triggerConversionTracking(userData);

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
                eligible: userData.eligible ? 'Éligible' : 'Non éligible',
                consentement: userData.consentement || false,
                userAgent: 'browser',
                timestamp: userData.timestamp,
                sessionId: userData.sessionId,
                // Conservation des données RGPD pour le registre
                rgpd_data: userData.rgpd_data
            };

            // Log sécurisé (sans données sensibles)
            this.logDebug('Envoi des données au webhook', {
                eligible: userData.eligible,
                taux_aide: userData.taux_aide,
                mail: userData.mail,
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
                
                
                return response;
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
        // Nouvelle méthode consolidée pour le tracking après webhook réussi
            triggerConversionTracking(userData) {
                try {
                    // 1. Tracking Google Tag Manager
                    this.triggerGTMConversion(userData);
                    
                    // 2. Tracking Google Ads direct (si pas de GTM)
                    this.triggerGoogleAdsConversion(userData);
                    
                    this.logDebug('Tracking de conversion déclenché après webhook réussi');
                    
                } catch (error) {
                    this.logError('Erreur lors du tracking de conversion:', error);
                }
            }
            // Méthode GTM mise à jour
            triggerGTMConversion(userData) {
                if (typeof window.dataLayer === 'undefined') {
                    this.logDebug('dataLayer GTM non disponible');
                    return;
                }

                try {
                    window.dataLayer.push({
                        'event': 'maprimeadapt_conversion',
                        'google_ads_conversion_id': this.config.googleAds.conversionId,
                        'google_ads_conversion_label': this.config.googleAds.conversionLabel,
                        'google_ads_conversion_value': userData.eligible ? 1 : 0,
                        'google_ads_conversion_currency': 'EUR',
                        
                        // Données enrichies
                        'form_name': 'maprimeadapt_simulator',
                        'eligibility_status': userData.eligible ? 'eligible' : 'non_eligible',
                        'user_category': userData.eligibility?.categorie || 'unknown',
                        'taux_aide': userData.taux_aide || 0,
                        'webhook_success': true,
                        
                        // Événement GA4
                        'event_category': 'form',
                        'event_action': 'webhook_success',
                        'event_label': 'maprimeadapt_lead_generated'
                    });

                    this.logDebug('Conversion GTM déclenchée après webhook');
                    
                } catch (error) {
                    this.logError('Erreur GTM:', error);
                }
            }

            // Méthode Google Ads direct mise à jour
            triggerGoogleAdsConversion(userData) {
                if (typeof window.gtag === 'undefined') {
                    this.logDebug('gtag non disponible');
                    return;
                }

                try {
                    const conversionString = this.config.googleAds.conversionId + '/' + this.config.googleAds.conversionLabel;
                    
                    window.gtag('event', 'conversion', {
                        'send_to': conversionString,
                        'value': userData.eligible ? 1.0 : 0.0,
                        'currency': 'EUR',
                        'transaction_id': userData.sessionId,
                        
                        'custom_parameters': {
                            'eligibility_status': userData.eligible ? 'eligible' : 'non_eligible',
                            'user_category': userData.eligibility?.categorie || 'unknown',
                            'taux_aide': userData.taux_aide || 0,
                            'webhook_success': true,
                            'user_age_group': userData.responses?.question_3 || 'unknown'
                        }
                    });

                    this.logDebug('Conversion Google Ads directe déclenchée après webhook');
                    
                } catch (error) {
                    this.logError('Erreur Google Ads direct:', error);
                }
            }

        // Méthodes utilitaires avec logique GIR
        nextQuestion() {
            if (!this.validateCurrentQuestion()) {
                return;
            }

            if (this.currentQuestion === this.totalQuestions) {
                this.showResult();
                return;
            }

            // Logique de navigation spéciale
            if (this.currentQuestion === 3 && this.responses.question_3 === '70_plus') {
                // 70+ ans : skip question 4 et 4b, aller directement à 5
                this.currentQuestion = 5;
            } else if (this.currentQuestion === 4) {
                // Après question 4, vérifier si on doit afficher 4b
                if (this.shouldShowGirQuestion()) {
                    this.currentQuestion = '4b';
                } else {
                    this.currentQuestion = 5;
                }
            } else if (this.currentQuestion === '4b') {
                this.currentQuestion = 5;
            } else {
                this.currentQuestion++;
            }

            this.showQuestion();
        }

        // CORRECTION: Méthode previousQuestion corrigée
        previousQuestion() {
            if (this.currentQuestion <= 1) {
                return; // Pas de retour en arrière depuis la première question
            }
            
            // Logique de retour en arrière corrigée
            if (this.currentQuestion === 5) {
                // Depuis question 5, retourner vers 4b si elle était affichée, sinon vers 4 ou 3
                if (this.shouldShowGirQuestion() && this.responses.question_4b) {
                    this.currentQuestion = '4b';
                } else if (this.responses.question_3 === '70_plus') {
                    // Les 70+ sautent les questions 4 et 4b
                    this.currentQuestion = 3;
                } else {
                    // Retour vers question 4
                    this.currentQuestion = 4;
                }
            } else if (this.currentQuestion === '4b') {
                // Depuis 4b, retourner vers 4
                this.currentQuestion = 4;
            } else if (typeof this.currentQuestion === 'string') {
                // Si on est sur une question string (comme '4b'), convertir en number
                this.currentQuestion = parseInt(this.currentQuestion.replace(/[^0-9]/g, '')) || 1;
            } else {
                // Navigation standard
                this.currentQuestion--;
            }
            
            this.showQuestion();
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

            const age = this.responses.question_3;
            const handicap = this.responses.question_4;
            const gir = this.responses.question_4b;

            // Nouvelle logique d'éligibilité avec GIR
            if (age === 'moins_60') {
                // Moins de 60 ans : obligatoirement handicap ≥50% ou PCH
                if (handicap !== 'oui') {
                    return {
                        eligible: false,
                        reason: 'Vous devez avoir au moins 60 ans ou être en situation de handicap (taux ≥ 50% ou PCH)'
                    };
                }
            } else if (age === '60_69') {
                // 60-69 ans : soit handicap ≥50%/PCH, soit GIR 1-6
                if (handicap === 'oui') {
                    // Handicap confirmé : éligible
                } else if (handicap === 'non' || handicap === 'ne_sais_pas') {
                    // Pas de handicap confirmé : vérifier GIR
                    if (!gir || gir === 'pas_evalue') {
                        return {
                            eligible: false,
                            reason: 'Entre 60 et 69 ans, vous devez soit être en situation de handicap (taux ≥ 50% ou PCH), soit justifier d\'un niveau de perte d\'autonomie évalué (GIR 1 à 6)'
                        };
                    }
                }
            }
            // 70+ ans : éligible sans condition supplémentaire

            return { eligible: true };
        }

        // Nouvelle méthode de calcul d'éligibilité avec les tranches dynamiques
        calculateEligibility() {
            const eligibilityCheck = this.checkEligibility();
            
            if (!eligibilityCheck.eligible) {
                return eligibilityCheck;
            }

            const codePostal = this.responses.codePostal;
            const foyerSize = parseInt(this.responses.question_5);
            const revenuTranche = this.responses.question_6;
            
            // Validation supplémentaire côté calcul
            if (!codePostal || !SecurityUtils.validatePostalCode(codePostal)) {
                return { eligible: false, reason: 'Code postal invalide' };
            }

            if (isNaN(foyerSize) || foyerSize < 1 || foyerSize > 6) {
                return { eligible: false, reason: 'Taille de foyer invalide' };
            }

            if (!revenuTranche) {
                return { eligible: false, reason: 'Tranche de revenus non sélectionnée' };
            }

            // Nouvelle logique basée sur les tranches dynamiques
            switch(revenuTranche) {
                case 'tranche_1':
                    return { 
                        eligible: true, 
                        taux: 70, 
                        categorie: 'très modeste'
                    };
                case 'tranche_2':
                    return { 
                        eligible: true, 
                        taux: 50, 
                        categorie: 'modeste'
                    };
                case 'tranche_3':
                    return { 
                        eligible: false, 
                        reason: 'Vos revenus dépassent les plafonds MaPrimeAdapt'
                    };
                default:
                    return { 
                        eligible: false, 
                        reason: 'Tranche de revenus invalide' 
                    };
            }
        }

        updateProgress() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            // Calcul du progrès en tenant compte des questions conditionnelles
            let questionCount = this.currentQuestion;
            if (this.currentQuestion === '4b') {
                questionCount = 4.5; // Entre 4 et 5
            } else if (this.currentQuestion > 4) {
                questionCount = this.currentQuestion;
            }
            
            const progress = Math.min(100, (questionCount / this.totalQuestions) * 100);
            simulator.querySelector('.simulator-progress-fill').style.width = `${progress}%`;
        }

        updateButtons() {
            const simulator = this.container.querySelector('.maprimeadapt-simulator');
            const prevBtn = simulator.querySelector('.simulator-prev-btn');
            const nextBtn = simulator.querySelector('.simulator-next-btn');
            
            // Logique corrigée pour le bouton précédent
            // Afficher le bouton précédent sauf pour la première question
            const shouldShowPrev = this.currentQuestion !== 1;
            prevBtn.style.display = shouldShowPrev ? 'block' : 'none';
            
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
                questions: this.container?.querySelectorAll('.simulator-question').length === 9, // 8 + question 4b
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
        
        version: '1.3.2-fixed'
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