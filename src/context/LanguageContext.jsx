import React, { createContext, useState, useContext, useEffect } from 'react';

// Complete translations for all languages
const translations = {
  en: {
    // Page Header
    instructorSettings: 'Instructor Settings',
    manageProfile: 'Manage your profile, preferences, and account settings',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    loading: 'Loading settings...',
    
    // Tabs
    profileTab: 'Profile',
    preferencesTab: 'Preferences',
    teachingTab: 'Teaching',
    securityTab: 'Security',
    billingTab: 'Billing',
    
    // Profile Tab
    profilePhoto: 'Profile Photo',
    uploadNewPhoto: 'Upload new photo',
    fullName: 'Full Name *',
    emailAddress: 'Email Address *',
    professionalTitle: 'Professional Title',
    company: 'Company / Organization',
    location: 'Location',
    website: 'Website / Portfolio',
    bio: 'Bio',
    characters: 'characters',
    areasOfExpertise: 'Areas of Expertise',
    certifications: 'Certifications',
    addCertification: 'Add a certification',
    socialLinks: 'Social Links',
    
    // Placeholders
    fullNamePlaceholder: 'Your full name',
    emailPlaceholder: 'your@email.com',
    titlePlaceholder: 'e.g., Senior Developer & Instructor',
    companyPlaceholder: 'Your company name',
    locationPlaceholder: 'City, Country',
    websitePlaceholder: 'https://yourwebsite.com',
    bioPlaceholder: 'Tell your students about yourself...',
    
    // Preferences Tab
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    chooseLanguage: 'Choose your preferred language for the platform interface',
    timezone: 'Timezone',
    notifications: 'Notifications',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    courseUpdates: 'Course Updates',
    studentMessages: 'Student Messages',
    marketingEmails: 'Marketing Emails',
    
    // Teaching Tab
    teachingStyle: 'Teaching Style',
    structured: 'Structured (Lecture-based)',
    interactive: 'Interactive (Hands-on)',
    project: 'Project-based',
    mixed: 'Mixed Approach',
    languagesYouTeach: 'Languages you teach in',
    yearsOfExperience: 'Years of Experience',
    education: 'Education',
    pricingModel: 'Pricing Model',
    fixedPrice: 'Fixed Price',
    subscription: 'Subscription',
    tieredPricing: 'Tiered Pricing',
    free: 'Free',
    experiencePlaceholder: '5',
    educationPlaceholder: 'B.S. Computer Science, MIT',
    
    // Security Tab
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    updatePassword: 'Update Password',
    twoFactorAuth: 'Two-Factor Authentication',
    twoFactorDesc: 'Add an extra layer of security to your account',
    enable2FA: 'Enable 2FA',
    disable2FA: 'Disable 2FA',
    twoFactorEnabled: 'Two-factor authentication is enabled',
    dangerZone: 'Danger Zone',
    dangerDesc: 'These actions are irreversible. Please proceed with caution.',
    deleteAccount: 'Delete Account',
    logoutAll: 'Log Out All Sessions',
    noActiveSessions: 'No active sessions',
    
    // Billing Tab
    paymentMethod: 'Payment Method',
    noPaymentMethod: 'No payment method added',
    addPaymentMethod: 'Add a payment method to start monetizing your courses',
    addCard: 'Add Card',
    payoutSettings: 'Payout Settings',
    bankTransfer: 'Bank Transfer',
    paypal: 'PayPal',
    stripe: 'Stripe',
    accountHolderName: 'Account Holder Name',
    accountNumber: 'Account Number',
    routingNumber: 'Routing Number',
    bankName: 'Bank Name',
    taxId: 'Tax ID / EIN (Optional)',
    businessName: 'Business Name (Optional)',
    recentPayouts: 'Recent Payouts',
    noPayouts: 'No payouts yet',
    startCreating: 'Start creating and selling courses to see earnings here',
    
    // Notifications
    success: 'Settings saved successfully!',
    error: 'Error saving settings',
    avatarSuccess: 'Avatar updated successfully!',
    avatarError: 'Error uploading avatar',
    imageTooLarge: 'Image must be less than 5MB',
    communities: 'Communities',
    chat: 'Chat',
    home: 'Home',
    myLearning: 'My Learning',
    certificates: 'Certificates',
    notes: 'Notes',
    settings: 'Settings',
    support: 'Support',
  },
  fr: {
    // Page Header
    instructorSettings: 'Param�tres du Formateur',
    manageProfile: 'G�rez votre profil, vos pr�f�rences et vos param�tres de compte',
    saveChanges: 'Enregistrer les modifications',
    saving: 'Enregistrement...',
    loading: 'Chargement des param�tres...',
    
    // Tabs
    profileTab: 'Profil',
    preferencesTab: 'Pr�f�rences',
    teachingTab: 'Enseignement',
    securityTab: 'S�curit�',
    billingTab: 'Facturation',
    
    // Profile Tab
    profilePhoto: 'Photo de Profil',
    uploadNewPhoto: 'T�l�charger une nouvelle photo',
    fullName: 'Nom Complet *',
    emailAddress: 'Adresse Email *',
    professionalTitle: 'Titre Professionnel',
    company: 'Entreprise / Organisation',
    location: 'Lieu',
    website: 'Site Web / Portfolio',
    bio: 'Biographie',
    characters: 'caract�res',
    areasOfExpertise: 'Domaines d\'expertise',
    certifications: 'Certifications',
    addCertification: 'Ajouter une certification',
    socialLinks: 'Liens Sociaux',
    
    // Placeholders
    fullNamePlaceholder: 'Votre nom complet',
    emailPlaceholder: 'votre@email.com',
    titlePlaceholder: 'ex: D�veloppeur Senior & Formateur',
    companyPlaceholder: 'Nom de votre entreprise',
    locationPlaceholder: 'Ville, Pays',
    websitePlaceholder: 'https://votresite.com',
    bioPlaceholder: 'Parlez de vous � vos �tudiants...',
    
    // Preferences Tab
    theme: 'Th�me',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Syst�me',
    language: 'Langue',
    chooseLanguage: 'Choisissez votre langue pr�f�r�e pour l\'interface de la plateforme',
    timezone: 'Fuseau Horaire',
    notifications: 'Notifications',
    emailNotifications: 'Notifications par Email',
    pushNotifications: 'Notifications Push',
    courseUpdates: 'Mises � jour des Cours',
    studentMessages: 'Messages des �tudiants',
    marketingEmails: 'Emails Marketing',
    
    // Teaching Tab
    teachingStyle: 'Style d\'Enseignement',
    structured: 'Structur� (Bas� sur les cours)',
    interactive: 'Interactif (Pratique)',
    project: 'Bas� sur des Projets',
    mixed: 'Approche Mixte',
    languagesYouTeach: 'Langues dans lesquelles vous enseignez',
    yearsOfExperience: 'Ann�es d\'Exp�rience',
    education: '�ducation',
    pricingModel: 'Mod�le de Tarification',
    fixedPrice: 'Prix Fixe',
    subscription: 'Abonnement',
    tieredPricing: 'Tarification par Niveaux',
    free: 'Gratuit',
    experiencePlaceholder: '5',
    educationPlaceholder: 'B.S. Informatique, MIT',
    
    // Security Tab
    changePassword: 'Changer le Mot de Passe',
    currentPassword: 'Mot de Passe Actuel',
    newPassword: 'Nouveau Mot de Passe',
    confirmPassword: 'Confirmer le Nouveau Mot de Passe',
    updatePassword: 'Mettre � Jour le Mot de Passe',
    twoFactorAuth: 'Authentification � Deux Facteurs',
    twoFactorDesc: 'Ajoutez une couche de s�curit� suppl�mentaire � votre compte',
    enable2FA: 'Activer 2FA',
    disable2FA: 'D�sactiver 2FA',
    twoFactorEnabled: 'L\'authentification � deux facteurs est activ�e',
    dangerZone: 'Zone de Danger',
    dangerDesc: 'Ces actions sont irr�versibles. Veuillez proc�der avec prudence.',
    deleteAccount: 'Supprimer le Compte',
    logoutAll: 'D�connecter Toutes les Sessions',
    noActiveSessions: 'Aucune session active',
    
    // Billing Tab
    paymentMethod: 'M�thode de Paiement',
    noPaymentMethod: 'Aucune m�thode de paiement ajout�e',
    addPaymentMethod: 'Ajoutez une m�thode de paiement pour commencer � mon�tiser vos cours',
    addCard: 'Ajouter une Carte',
    payoutSettings: 'Param�tres de Paiement',
    bankTransfer: 'Virement Bancaire',
    paypal: 'PayPal',
    stripe: 'Stripe',
    accountHolderName: 'Nom du Titulaire du Compte',
    accountNumber: 'Num�ro de Compte',
    routingNumber: 'Num�ro d\'Acheminement',
    bankName: 'Nom de la Banque',
    taxId: 'N� d\'Identification Fiscale (Optionnel)',
    businessName: 'Nom de l\'Entreprise (Optionnel)',
    recentPayouts: 'Paiements R�cents',
    noPayouts: 'Aucun paiement pour le moment',
    startCreating: 'Commencez � cr�er et vendre des cours pour voir vos revenus ici',
    
    // Notifications
    success: 'Param�tres enregistr�s avec succ�s !',
    error: 'Erreur lors de l\'enregistrement des param�tres',
    avatarSuccess: 'Avatar mis � jour avec succ�s !',
    avatarError: 'Erreur lors du t�l�chargement de l\'avatar',
    imageTooLarge: 'L\'image doit faire moins de 5 Mo',
  },
  es: {
    // Page Header
    instructorSettings: 'Configuraci�n del Instructor',
    manageProfile: 'Administre su perfil, preferencias y configuraci�n de la cuenta',
    saveChanges: 'Guardar Cambios',
    saving: 'Guardando...',
    loading: 'Cargando configuraci�n...',
    
    // Tabs
    profileTab: 'Perfil',
    preferencesTab: 'Preferencias',
    teachingTab: 'Ense�anza',
    securityTab: 'Seguridad',
    billingTab: 'Facturaci�n',
    
    // Profile Tab
    profilePhoto: 'Foto de Perfil',
    uploadNewPhoto: 'Subir nueva foto',
    fullName: 'Nombre Completo *',
    emailAddress: 'Correo Electr�nico *',
    professionalTitle: 'T�tulo Profesional',
    company: 'Empresa / Organizaci�n',
    location: 'Ubicaci�n',
    website: 'Sitio Web / Portafolio',
    bio: 'Biograf�a',
    characters: 'caracteres',
    areasOfExpertise: '�reas de Especializaci�n',
    certifications: 'Certificaciones',
    addCertification: 'A�adir una certificaci�n',
    socialLinks: 'Enlaces Sociales',
    
    // Placeholders
    fullNamePlaceholder: 'Su nombre completo',
    emailPlaceholder: 'su@email.com',
    titlePlaceholder: 'ej: Desarrollador Senior & Instructor',
    companyPlaceholder: 'Nombre de su empresa',
    locationPlaceholder: 'Ciudad, Pa�s',
    websitePlaceholder: 'https://susitio.com',
    bioPlaceholder: 'Cu�nteles sobre usted a sus estudiantes...',
    
    // Preferences Tab
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    chooseLanguage: 'Elija su idioma preferido para la interfaz de la plataforma',
    timezone: 'Zona Horaria',
    notifications: 'Notificaciones',
    emailNotifications: 'Notificaciones por Correo',
    pushNotifications: 'Notificaciones Push',
    courseUpdates: 'Actualizaciones de Cursos',
    studentMessages: 'Mensajes de Estudiantes',
    marketingEmails: 'Correos de Marketing',
    
    // Teaching Tab
    teachingStyle: 'Estilo de Ense�anza',
    structured: 'Estructurado (Basado en clases)',
    interactive: 'Interactivo (Pr�ctico)',
    project: 'Basado en Proyectos',
    mixed: 'Enfoque Mixto',
    languagesYouTeach: 'Idiomas en los que ense�a',
    yearsOfExperience: 'A�os de Experiencia',
    education: 'Educaci�n',
    pricingModel: 'Modelo de Precios',
    fixedPrice: 'Precio Fijo',
    subscription: 'Suscripci�n',
    tieredPricing: 'Precios por Niveles',
    free: 'Gratis',
    experiencePlaceholder: '5',
    educationPlaceholder: 'B.S. Inform�tica, MIT',
    
    // Security Tab
    changePassword: 'Cambiar Contrase�a',
    currentPassword: 'Contrase�a Actual',
    newPassword: 'Nueva Contrase�a',
    confirmPassword: 'Confirmar Nueva Contrase�a',
    updatePassword: 'Actualizar Contrase�a',
    twoFactorAuth: 'Autenticaci�n de Dos Factores',
    twoFactorDesc: 'A�ada una capa adicional de seguridad a su cuenta',
    enable2FA: 'Activar 2FA',
    disable2FA: 'Desactivar 2FA',
    twoFactorEnabled: 'La autenticaci�n de dos factores est� activada',
    dangerZone: 'Zona de Peligro',
    dangerDesc: 'Estas acciones son irreversibles. Proceda con precauci�n.',
    deleteAccount: 'Eliminar Cuenta',
    logoutAll: 'Cerrar Todas las Sesiones',
    noActiveSessions: 'No hay sesiones activas',
    
    // Billing Tab
    paymentMethod: 'M�todo de Pago',
    noPaymentMethod: 'No se ha a�adido ning�n m�todo de pago',
    addPaymentMethod: 'A�ada un m�todo de pago para comenzar a monetizar sus cursos',
    addCard: 'A�adir Tarjeta',
    payoutSettings: 'Configuraci�n de Pagos',
    bankTransfer: 'Transferencia Bancaria',
    paypal: 'PayPal',
    stripe: 'Stripe',
    accountHolderName: 'Nombre del Titular de la Cuenta',
    accountNumber: 'N�mero de Cuenta',
    routingNumber: 'N�mero de Ruta',
    bankName: 'Nombre del Banco',
    taxId: 'ID Fiscal / EIN (Opcional)',
    businessName: 'Nombre de la Empresa (Opcional)',
    recentPayouts: 'Pagos Recientes',
    noPayouts: 'No hay pagos a�n',
    startCreating: 'Comience a crear y vender cursos para ver sus ganancias aqu�',
    
    // Notifications
    success: '�Configuraci�n guardada con �xito!',
    error: 'Error al guardar la configuraci�n',
    avatarSuccess: '�Avatar actualizado con �xito!',
    avatarError: 'Error al subir el avatar',
    imageTooLarge: 'La imagen debe ser menor de 5 MB',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('preferred_language');
    return saved || 'en';
  });

  const [t, setT] = useState(translations[language] || translations.en);

  useEffect(() => {
    // The fetch for dynamic locales was failing. Reverting to use the
    // translations object defined in this file.
    setT(translations[language] || translations.en);
    localStorage.setItem('preferred_language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr'; // TODO: Handle RTL languages
  }, [language]);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
