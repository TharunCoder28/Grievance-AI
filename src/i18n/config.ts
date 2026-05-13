import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          nav: {
            home: "Home",
            submit: "Submit Grievance",
            dashboard: "Dashboard",
            citizenLogin: "Citizen Login",
            adminPortal: "Admin Portal"
          },
          hero: {
            title: "Intelligent Grievance Management System",
            subtitle: "Powered by AI to categorize, prioritize, and automate your grievances for a smarter e-governance.",
            getStarted: "Get Started",
            learnMore: "Learn More"
          },
          features: {
            aiClassification: "AI Classification",
            aiClassificationDesc: "Auto-categorize grievances using NLP.",
            realTimeTracking: "Real-Time Tracking",
            realTimeTrackingDesc: "Track your grievance status live.",
            smartDashboard: "Smart Dashboard",
            smartDashboardDesc: "Insights for local authorities.",
            evidenceSupport: "Evidence Support",
            evidenceSupportDesc: "Attach videos and photos easily."
          },
          footer: {
            builtBy: "Built with precision by",
            rights: "All rights reserved.",
            info: "Intelligent multi-department classification framework."
          }
        }
      },
      hi: {
        translation: {
          nav: {
            home: "होम",
            submit: "शिकायत दर्ज करें",
            dashboard: "डैशबोर्ड",
            citizenLogin: "नागरिक लॉगिन",
            adminPortal: "एडमिन पोर्टल"
          },
          hero: {
            title: "इंटेलिजेंट शिकायत प्रबंधन प्रणाली",
            subtitle: "स्मार्ट ई-गवर्नेंस के लिए आपकी शिकायतों को वर्गीकृत, प्राथमिकता देने और स्वचालित करने के लिए AI द्वारा संचालित।",
            getStarted: "शुरू करें",
            learnMore: "अधिक जानें"
          },
          features: {
            aiClassification: "AI वर्गीकरण",
            aiClassificationDesc: "NLP का उपयोग करके शिकायतों को स्वतः वर्गीकृत करें।",
            realTimeTracking: "रियल-टाइम ट्रैकिंग",
            realTimeTrackingDesc: "अपनी शिकायत की स्थिति को लाइव ट्रैक करें।",
            smartDashboard: "स्मार्ट डैशबोर्ड",
            smartDashboardDesc: "स्थानीय अधिकारियों के लिए अंतर्दृष्टि।",
            evidenceSupport: "प्रमाण समर्थन",
            evidenceSupportDesc: "आसानी से वीडियो और फोटो संलग्न करें।"
          },
          footer: {
            builtBy: "द्वारा सटीकता के साथ निर्मित",
            rights: "सर्वाधिकार सुरक्षित।",
            info: "इंटेलिजेंट मल्टी-डिपार्टमेंट वर्गीकरण ढांचा।"
          }
        }
      },
      ta: {
        translation: {
          nav: {
            home: "முகப்பு",
            submit: "புகாரைச் சமர்ப்பிக்கவும்",
            dashboard: "டாஷ்போர்டு",
            citizenLogin: "குடிமகன் உள்நுழைவு",
            adminPortal: "நிர்வாகி போர்டல்"
          },
          hero: {
            title: "அறிவுசார் குறைதீர்க்கும் மேலாண்மை அமைப்பு",
            subtitle: "உங்கள் குறைகளை வகைப்படுத்தவும், முன்னுரிமை அளிக்கவும் மற்றும் தானியங்குபடுத்தவும் AI மூலம் இயக்கப்படுகிறது.",
            getStarted: "தொடங்கவும்",
            learnMore: "மேலும் அறிய"
          },
          features: {
            aiClassification: "AI வகைப்பாடு",
            aiClassificationDesc: "NLP ஐப் பயன்படுத்தி குறைகளைத் தானாக வகைப்படுத்தவும்.",
            realTimeTracking: "நிகழ்நேர கண்காணிப்பு",
            realTimeTrackingDesc: "உங்கள் குறைபாட்டின் நிலையை நேரலையில் கண்காணிக்கவும்.",
            smartDashboard: "ஸ்மார்ட் டாஷ்போர்டு",
            smartDashboardDesc: "உள்ளூர் அதிகாரிகளுக்கான நுண்ணறிவு.",
            evidenceSupport: "ஆதார ஆதரவு",
            evidenceSupportDesc: "வீடியோக்கள் மற்றும் புகைப்படங்களை எளிதாக இணைக்கவும்."
          },
          footer: {
            builtBy: "துல்லியமாக உருவாக்கியவர்",
            rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
            info: "அறிவுசார் பல்துறை வகைப்பாடு கட்டமைப்பு."
          }
        }
      }
    }
  });

export default i18n;
