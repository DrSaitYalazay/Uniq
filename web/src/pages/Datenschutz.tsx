import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, FileCheck, Server, Globe, Users, ShieldCheck, AlertTriangle, CheckCircle, Database, Key, Fingerprint } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ScrollToTop from "@/components/ScrollToTop";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Datenschutz = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang === "de";
  const t = (deText: string, enText: string) => de ? deText : enText;

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title={de ? "Datenschutzerklärung | UniqSuite" : "Privacy Policy | UniqSuite"}
        description={de
          ? "Datenschutzerklärung von UniqSuite gemäß DSGVO und BDSG: Datenerhebung, Verarbeitung, Speicherung und Ihre Rechte als betroffene Person."
          : "Privacy policy of UniqSuite per GDPR and German BDSG: data collection, processing, storage, and your rights as a data subject."}
        path="/datenschutz"
        lang={lang}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": de ? "Datenschutzerklärung" : "Privacy Policy",
          "url": "https://uniq.cyberwerk.online/datenschutz",
          "description": de ? "DSGVO-konforme Datenschutzerklärung von UniqSuite." : "GDPR-compliant privacy policy of UniqSuite.",
          "isPartOf": { "@type": "WebSite", "name": "UniqSuite", "url": "https://uniq.cyberwerk.online" },
          "inLanguage": de ? "de-DE" : "en-US",
        }}
      />
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("Zurück", "Back")}
        </button>

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl eu-gradient p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="relative flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shrink-0">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight">
                {t("Datenschutzerklärung", "Privacy Policy")}
              </h1>
              <p className="text-primary-foreground/70 mt-2 text-base leading-relaxed max-w-2xl">
                {t(
                  "Umfassende Informationen zum Schutz Ihrer personenbezogenen Daten gemäß der Datenschutz-Grundverordnung (DSGVO/EU 2016/679) und dem Bundesdatenschutzgesetz (BDSG).",
                  "Comprehensive information about the protection of your personal data in accordance with the General Data Protection Regulation (GDPR/EU 2016/679) and the Federal Data Protection Act (BDSG)."
                )}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {["DSGVO", "BDSG", "EU 2016/679", "Art. 13/14", "ISO 27001"].map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-primary-foreground/80 border border-white/20 rounded-full px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Eye, labelDe: "Datenerhebung", labelEn: "Data Collection", anchor: "#section-3" },
            { icon: Lock, labelDe: "Sicherheit", labelEn: "Security", anchor: "#section-8" },
            { icon: Users, labelDe: "Ihre Rechte", labelEn: "Your Rights", anchor: "#section-7" },
            { icon: ShieldCheck, labelDe: "Zertifizierungen", labelEn: "Certifications", anchor: "#section-9" },
          ].map((item, i) => (
            <a key={i} href={item.anchor} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:border-secondary/30 transition-all card-elevated">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${i % 2 === 0 ? 'eu-gradient' : 'gold-gradient'}`}>
                <item.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">{t(item.labelDe, item.labelEn)}</span>
            </a>
          ))}
        </div>

        {/* Main content */}
        <h2 className="sr-only">{t("Datenschutzbestimmungen im Detail", "Privacy Policy Details")}</h2>
        <div className="bg-card rounded-2xl border-2 border-primary/5 overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
          <Accordion type="multiple" defaultValue={["section-1", "section-2"]} className="divide-y divide-border">

            {/* 1. Allgemeine Hinweise */}
            <AccordionItem value="section-1" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg eu-gradient flex items-center justify-center shrink-0">
                    <FileCheck className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("1. Allgemeine Hinweise und Pflichtinformationen", "1. General Information and Mandatory Disclosures")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Der Schutz Ihrer persönlichen Daten ist uns ein besonders wichtiges Anliegen. In dieser Datenschutzerklärung informieren wir Sie ausführlich darüber, welche personenbezogenen Daten wir auf unserer Website und bei der Nutzung unserer Dienste erheben, zu welchen Zwecken wir diese Daten verarbeiten, auf welcher Rechtsgrundlage die Verarbeitung erfolgt und welche Rechte Ihnen als betroffene Person zustehen.",
                  "The protection of your personal data is a particularly important concern for us. In this privacy policy, we inform you in detail about what personal data we collect on our website and when using our services, for what purposes we process this data, on what legal basis the processing takes place, and what rights you have as a data subject."
                )}</p>
                <p>{t(
                  "Die Verarbeitung personenbezogener Daten erfolgt stets im Einklang mit der Datenschutz-Grundverordnung (DSGVO), dem Bundesdatenschutzgesetz (BDSG) sowie allen weiteren anwendbaren datenschutzrechtlichen Bestimmungen. Wir haben umfangreiche technische und organisatorische Maßnahmen implementiert, um einen möglichst lückenlosen Schutz der über diese Website verarbeiteten personenbezogenen Daten sicherzustellen.",
                  "The processing of personal data is always carried out in accordance with the General Data Protection Regulation (GDPR), the Federal Data Protection Act (BDSG) and all other applicable data protection regulations. We have implemented extensive technical and organizational measures to ensure the most comprehensive protection possible of personal data processed through this website."
                )}</p>
                <p>{t(
                  "Personenbezogene Daten im Sinne dieser Datenschutzerklärung sind alle Daten, mit denen Sie persönlich identifiziert werden können. Hierzu zählen u.a. Ihr Name, Ihre E-Mail-Adresse, Ihre Anschrift, Ihre Telefonnummer oder auch Ihre IP-Adresse. Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber.",
                  "Personal data within the meaning of this privacy policy is any data by which you can be personally identified. This includes, among other things, your name, email address, postal address, telephone number, or your IP address. Data processing on this website is carried out by the website operator."
                )}</p>
                <p>{t(
                  "Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich. Dennoch setzen wir alle uns zur Verfügung stehenden Maßnahmen ein, um Ihre Daten bestmöglich zu schützen.",
                  "We would like to point out that data transmission over the Internet (e.g., when communicating by email) may have security vulnerabilities. Complete protection of data against access by third parties is not possible. Nevertheless, we employ all measures available to us to protect your data as effectively as possible."
                )}</p>
                <div className="bg-muted/40 rounded-xl p-4 border border-border/60 space-y-2">
                  <p className="text-xs font-semibold text-foreground">{t("Begriffsbestimmungen (Art. 4 DSGVO)", "Definitions (Art. 4 GDPR)")}</p>
                  <p className="text-xs">{t(
                    "Die in dieser Datenschutzerklärung verwendeten Begriffe entsprechen den Definitionen der DSGVO, insbesondere Art. 4 DSGVO. Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen.",
                    "The terms used in this privacy policy correspond to the definitions of the GDPR, in particular Art. 4 GDPR. Personal data is any information relating to an identified or identifiable natural person."
                  )}</p>
                  <p className="text-xs">{t(
                    "Verarbeitung ist jeder Vorgang im Zusammenhang mit personenbezogenen Daten (Erheben, Erfassen, Ordnen, Speichern, Anpassen, Verändern, Auslesen, Abfragen, Verwenden, Offenlegen, Verbreiten, Abgleichen, Verknüpfen, Einschränken, Löschen oder Vernichten).",
                    "Processing means any operation performed on personal data, whether or not by automated means (collection, recording, organization, storage, adaptation, alteration, retrieval, consultation, use, disclosure, dissemination, alignment, combination, restriction, erasure or destruction)."
                  )}</p>
                  <p className="text-xs">{t(
                    "Verantwortlicher ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet.",
                    "Controller means the natural or legal person who, alone or jointly with others, determines the purposes and means of the processing of personal data."
                  )}</p>
                </div>
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-secondary mb-1">{t("Geltungsbereich", "Scope")}</p>
                  <p className="text-xs">{t(
                    "Diese Datenschutzerklärung gilt für die von Cyberwerk betriebene Web-Applikation UniqSuite (Compliance- und ISMS-Management-Plattform für u. a. ISO 27001, NIS2, DORA und DSGVO).",
                    "This privacy policy applies to the web application UniqSuite (compliance and ISMS management platform for e.g. ISO 27001, NIS2, DORA and GDPR) operated by Cyberwerk."
                  )}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Verantwortlicher */}
            <AccordionItem value="section-2" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("2. Verantwortlicher für die Datenverarbeitung", "2. Data Controller")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der DSGVO ist:",
                  "The controller responsible for data processing on this website within the meaning of the GDPR is:"
                )}</p>
                <div className="bg-muted/30 rounded-xl p-5 space-y-1.5 border border-border/60">
                  <p className="font-bold text-foreground text-base">Cyberwerk</p>
                  <p>{t("Inhaber: Dr. Sait Yalazay", "Owner: Dr. Sait Yalazay")}</p>
                  <p>{t("Deutschland", "Germany")}</p>
                  <p>E-Mail: <a href="mailto:info@cyberwerksuite.com" className="text-primary hover:underline font-medium">info@cyberwerksuite.com</a></p>
                  <p>{t("Datenschutzanfragen", "Privacy inquiries")}: <a href="mailto:privacy@cyberwerksuite.com" className="text-primary hover:underline font-medium">privacy@cyberwerksuite.com</a></p>
                  <p>Website: <a href="https://www.cyberwerksuite.com" className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">www.cyberwerksuite.com</a></p>
                </div>
                <p>{t(
                  "Der Verantwortliche entscheidet allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung personenbezogener Daten. Anfragen zum Datenschutz richten Sie bitte an die oben genannte E-Mail-Adresse.",
                  "The controller decides alone or jointly with others about the purposes and means of processing personal data. Please direct any data protection inquiries to the email address above."
                )}</p>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Datenerhebung */}
            <AccordionItem value="section-3" id="section-3" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg eu-gradient flex items-center justify-center shrink-0">
                    <Database className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("3. Erhebung und Speicherung personenbezogener Daten", "3. Collection and Storage of Personal Data")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <h3 className="font-bold text-foreground">{t("3.1 Beim Besuch der Website", "3.1 When Visiting the Website")}</h3>
                <p>{t(
                  "Beim Aufrufen unserer Website werden durch den Browser auf Ihrem Endgerät automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in sogenannten Server-Logfiles gespeichert. Folgende Informationen werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:",
                  "When you access our website, your browser automatically sends information to our website server. This information is temporarily stored in so-called server log files. The following information is collected without any action on your part and stored until automated deletion:"
                )}</p>
                <ul className="space-y-2 ml-1">
                  {[
                    { de: "IP-Adresse des anfragenden Rechners (ggf. anonymisiert)", en: "IP address of the requesting computer (anonymized if applicable)" },
                    { de: "Datum und Uhrzeit des Zugriffs (Zeitstempel)", en: "Date and time of access (timestamp)" },
                    { de: "Name und URL der abgerufenen Datei", en: "Name and URL of the accessed file" },
                    { de: "Website, von der aus der Zugriff erfolgt (Referrer-URL)", en: "Website from which access was made (referrer URL)" },
                    { de: "Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners", en: "Browser used and, if applicable, the operating system of your computer" },
                    { de: "Name des Access-Providers", en: "Name of the access provider" },
                    { de: "Übertragenes Datenvolumen", en: "Amount of data transferred" },
                    { de: "HTTP-Statuscode", en: "HTTP status code" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                      <span>{t(item.de, item.en)}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-secondary mb-1">{t("Rechtsgrundlage", "Legal Basis")}</p>
                  <p className="text-xs">{t(
                    "Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. f DSGVO auf Basis unseres berechtigten Interesses an der Sicherstellung eines störungsfreien Betriebs der Website sowie der Verbesserung unseres Angebots.",
                    "Processing is carried out in accordance with Art. 6(1)(f) GDPR based on our legitimate interest in ensuring trouble-free operation of the website and improving our services."
                  )}</p>
                </div>

                <h3 className="font-bold text-foreground pt-2">{t("3.2 Bei Nutzung unserer Tools", "3.2 When Using Our Tools")}</h3>
                <p>{t(
                  "Bei der Nutzung von UniqSuite können zusätzliche personenbezogene Daten verarbeitet werden. Dies umfasst insbesondere Registrierungsdaten (Name, E-Mail-Adresse, Organisation), Nutzungsdaten und ggf. unternehmensbezogene Compliance-Daten, die Sie in die Tools eingeben.",
                  "When using UniqSuite, additional personal data may be processed. This includes in particular registration data (name, email address, organization), usage data and, where applicable, company-related compliance data that you enter into the tools."
                )}</p>
                <p>{t(
                  "Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsdurchführung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bereitstellung der Dienste).",
                  "Processing of this data is based on Art. 6(1)(b) GDPR (performance of contract) and Art. 6(1)(f) GDPR (legitimate interest in providing services)."
                )}</p>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Cookies */}
            <AccordionItem value="section-4" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    <Fingerprint className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("4. Cookies und Tracking-Technologien", "4. Cookies and Tracking Technologies")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden und die Ihr Browser speichert. Sie dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen.",
                  "Our website uses cookies. Cookies are small text files stored on your device by your browser. They serve to make our services more user-friendly, effective and secure."
                )}</p>
                <h4 className="font-semibold text-foreground">{t("4.1 Technisch notwendige Cookies", "4.1 Technically Necessary Cookies")}</h4>
                <p>{t(
                  "Diese Cookies sind für den Betrieb der Website unbedingt erforderlich. Hierzu gehören z.B. Cookies, die die Sprachauswahl oder den Login-Status speichern. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.",
                  "These cookies are absolutely necessary for the operation of the website. These include, for example, cookies that save language selection or login status. Legal basis: Art. 6(1)(f) GDPR."
                )}</p>
                <h4 className="font-semibold text-foreground">{t("4.2 Analyse-Cookies", "4.2 Analytics Cookies")}</h4>
                <p>{t(
                  "Wir setzen derzeit keine Analyse- oder Tracking-Tools von Drittanbietern ein. Sollte sich dies in Zukunft ändern, werden wir Sie vorab informieren und Ihre Einwilligung einholen (Art. 6 Abs. 1 lit. a DSGVO).",
                  "We currently do not use any third-party analytics or tracking tools. Should this change in the future, we will inform you in advance and obtain your consent (Art. 6(1)(a) GDPR)."
                )}</p>
                <p>{t(
                  "Sie können Ihre Cookie-Einstellungen jederzeit über die Einstellungen Ihres Browsers ändern. Bereits gesetzte Cookies können jederzeit gelöscht werden. Bitte beachten Sie, dass Teile dieser Website ohne Cookies möglicherweise nicht ordnungsgemäß funktionieren.",
                  "You can change your cookie settings at any time via your browser settings. Cookies that have already been set can be deleted at any time. Please note that parts of this website may not function properly without cookies."
                )}</p>
                <p>{t("Weitere Informationen finden Sie in unseren ", "For more information, see our ")}
                  <Link to="/cookie-einstellungen" className="text-primary hover:underline font-medium">{t("Cookie-Einstellungen", "Cookie Settings")}</Link>.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Kontaktaufnahme */}
            <AccordionItem value="section-5" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg eu-gradient flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("5. Kontaktaufnahme und Kommunikation", "5. Contact and Communication")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Wenn Sie uns per E-Mail oder über ein Kontaktformular kontaktieren, werden die von Ihnen übermittelten personenbezogenen Daten (z.B. Name, E-Mail-Adresse, Inhalt der Anfrage) zum Zwecke der Bearbeitung Ihrer Anfrage gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung an Dritte weiter.",
                  "If you contact us by email or via a contact form, the personal data you provide (e.g., name, email address, content of the inquiry) will be stored and processed for the purpose of processing your inquiry. We will not share this data with third parties without your consent."
                )}</p>
                <p>{t(
                  "Die Verarbeitung der in das Kontaktformular eingegebenen Daten erfolgt ausschließlich auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) oder auf Basis unseres berechtigten Interesses an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO). Im Falle einer Vertragsanbahnung ist die Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO.",
                  "Processing of the data entered in the contact form is carried out exclusively on the basis of your consent (Art. 6(1)(a) GDPR) or on the basis of our legitimate interest in the effective processing of inquiries directed to us (Art. 6(1)(f) GDPR). In the case of pre-contractual measures, the legal basis is Art. 6(1)(b) GDPR."
                )}</p>
                <p>{t(
                  "Die von Ihnen im Kontaktformular oder per E-Mail übersandten Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt. Zwingende gesetzliche Bestimmungen – insbesondere Aufbewahrungsfristen – bleiben unberührt.",
                  "The data you send us via the contact form or email will remain with us until you request deletion, revoke your consent to storage, or the purpose for data storage no longer applies. Mandatory statutory provisions – particularly retention periods – remain unaffected."
                )}</p>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Speicherdauer */}
            <AccordionItem value="section-6" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    <Server className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("6. Speicherdauer und Löschung", "6. Storage Duration and Deletion")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder sofern dies durch gesetzliche Vorgaben vorgesehen ist. Nach Ablauf der Speicherfrist werden die entsprechenden Daten routinemäßig und gemäß den gesetzlichen Vorschriften gesperrt oder gelöscht.",
                  "Personal data is only stored for as long as is necessary for the respective processing purpose or as required by law. After expiry of the storage period, the corresponding data is routinely blocked or deleted in accordance with legal requirements."
                )}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { de: "Server-Logfiles: 7–30 Tage", en: "Server log files: 7–30 days" },
                    { de: "Kontaktanfragen: bis zur vollständigen Bearbeitung + 6 Monate", en: "Contact inquiries: until complete processing + 6 months" },
                    { de: "Vertragsdaten: 10 Jahre (steuerliche Aufbewahrungspflicht)", en: "Contract data: 10 years (tax retention obligation)" },
                    { de: "Tool-Nutzungsdaten: Dauer der Geschäftsbeziehung + 3 Monate", en: "Tool usage data: Duration of business relationship + 3 months" },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/40 rounded-lg p-3 border border-border/60 text-xs">
                      <span className="font-medium text-foreground">{t(item.de, item.en)}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 7. Ihre Rechte */}
            <AccordionItem value="section-7" id="section-7" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg eu-gradient flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("7. Ihre Rechte als betroffene Person", "7. Your Rights as a Data Subject")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Sie haben nach der DSGVO verschiedene Rechte, die Sie uns gegenüber geltend machen können. Dazu gehören insbesondere:",
                  "Under the GDPR, you have various rights that you can assert against us. These include in particular:"
                )}</p>
                <div className="space-y-3">
                  {[
                    { titleDe: "Auskunftsrecht (Art. 15 DSGVO)", titleEn: "Right of Access (Art. 15 GDPR)", descDe: "Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob betreffende personenbezogene Daten verarbeitet werden. Im Falle einer solchen Verarbeitung können Sie Auskunft über die Daten und die Verarbeitungsumstände verlangen.", descEn: "You have the right to request confirmation as to whether personal data concerning you is being processed. In case of such processing, you can request information about the data and circumstances of processing." },
                    { titleDe: "Recht auf Berichtigung (Art. 16 DSGVO)", titleEn: "Right to Rectification (Art. 16 GDPR)", descDe: "Sie haben das Recht, unverzüglich die Berichtigung unrichtiger oder die Vervollständigung unvollständiger personenbezogener Daten zu verlangen.", descEn: "You have the right to request immediate rectification of inaccurate or completion of incomplete personal data." },
                    { titleDe: "Recht auf Löschung (Art. 17 DSGVO)", titleEn: "Right to Erasure (Art. 17 GDPR)", descDe: "Sie haben das Recht, die unverzügliche Löschung Ihrer personenbezogenen Daten zu verlangen, sofern einer der gesetzlich genannten Gründe zutrifft.", descEn: "You have the right to request immediate erasure of your personal data, provided one of the legally specified grounds applies." },
                    { titleDe: "Recht auf Einschränkung (Art. 18 DSGVO)", titleEn: "Right to Restriction (Art. 18 GDPR)", descDe: "Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen, wenn bestimmte Voraussetzungen vorliegen.", descEn: "You have the right to request restriction of processing of your personal data when certain conditions are met." },
                    { titleDe: "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)", titleEn: "Right to Data Portability (Art. 20 GDPR)", descDe: "Sie haben das Recht, die Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.", descEn: "You have the right to receive the data we process automatically based on your consent or in fulfillment of a contract in a structured, commonly used and machine-readable format." },
                    { titleDe: "Widerspruchsrecht (Art. 21 DSGVO)", titleEn: "Right to Object (Art. 21 GDPR)", descDe: "Sie haben das Recht, jederzeit gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen, wenn die Verarbeitung auf Art. 6 Abs. 1 lit. e oder f DSGVO beruht.", descEn: "You have the right to object at any time to the processing of your personal data if processing is based on Art. 6(1)(e) or (f) GDPR." },
                    { titleDe: "Beschwerderecht (Art. 77 DSGVO)", titleEn: "Right to Lodge a Complaint (Art. 77 GDPR)", descDe: "Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.", descEn: "You have the right to lodge a complaint with a data protection supervisory authority about our processing of your personal data." },
                  ].map((right, i) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-4 border border-border/60">
                      <p className="font-semibold text-foreground text-sm mb-1">{t(right.titleDe, right.titleEn)}</p>
                      <p className="text-xs leading-relaxed">{t(right.descDe, right.descEn)}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 8. Datensicherheit */}
            <AccordionItem value="section-8" id="section-8" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("8. Datensicherheit und technische Maßnahmen", "8. Data Security and Technical Measures")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Wir verwenden umfangreiche technische und organisatorische Sicherheitsmaßnahmen (TOMs) gemäß Art. 32 DSGVO, um Ihre Daten gegen zufällige oder vorsätzliche Manipulation, teilweisen oder vollständigen Verlust, Zerstörung oder gegen den unbefugten Zugriff Dritter zu schützen. Unsere Sicherheitsmaßnahmen werden entsprechend der technologischen Entwicklung fortlaufend verbessert und regelmäßig überprüft.",
                  "We use extensive technical and organizational security measures (TOMs) in accordance with Art. 32 GDPR to protect your data against accidental or intentional manipulation, partial or complete loss, destruction, or unauthorized access by third parties. Our security measures are continuously improved in line with technological developments and regularly reviewed."
                )}</p>

                <h4 className="font-semibold text-foreground pt-1">{t("8.1 Technische Maßnahmen", "8.1 Technical Measures")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Lock, de: "TLS 1.3 / SSL-Verschlüsselung für alle Datenübertragungen zwischen Client und Server", en: "TLS 1.3 / SSL encryption for all data transfers between client and server" },
                    { icon: Key, de: "AES-256-Bit-Verschlüsselung sensibler Daten at rest in der Datenbank", en: "AES-256-bit encryption of sensitive data at rest in the database" },
                    { icon: Shield, de: "Multi-Faktor-Authentifizierung (MFA) mit TOTP-Authenticator für alle Benutzerkonten", en: "Multi-factor authentication (MFA) with TOTP authenticator for all user accounts" },
                    { icon: Server, de: "EU-basierte Server und Hosting-Infrastruktur (kein Datentransfer in Drittländer)", en: "EU-based servers and hosting infrastructure (no data transfer to third countries)" },
                    { icon: Eye, de: "Regelmäßige Sicherheitsaudits, Vulnerability Scans und Penetrationstests", en: "Regular security audits, vulnerability scans and penetration tests" },
                    { icon: Database, de: "Tägliche automatische verschlüsselte Backups mit Geo-Redundanz und regelmäßigen Restore-Tests", en: "Daily automatic encrypted backups with geo-redundancy and regular restore tests" },
                    { icon: AlertTriangle, de: "Intrusion Detection System (IDS), Intrusion Prevention System (IPS) und DDoS-Schutz", en: "Intrusion Detection System (IDS), Intrusion Prevention System (IPS) and DDoS protection" },
                    { icon: Users, de: "Rollenbasierte Zugriffssteuerung (RBAC) nach dem Principle of Least Privilege", en: "Role-based access control (RBAC) following the Principle of Least Privilege" },
                    { icon: Lock, de: "Web Application Firewall (WAF) zum Schutz gegen OWASP Top 10 Bedrohungen", en: "Web Application Firewall (WAF) for protection against OWASP Top 10 threats" },
                    { icon: Key, de: "Sichere Schlüsselverwaltung (Key Management) mit regelmäßiger Schlüsselrotation", en: "Secure key management with regular key rotation" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-muted/40 rounded-lg p-3 border border-border/60">
                      <item.icon className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span className="text-xs font-medium">{t(item.de, item.en)}</span>
                    </div>
                  ))}
                </div>

                <h4 className="font-semibold text-foreground pt-2">{t("8.2 Organisatorische Maßnahmen", "8.2 Organizational Measures")}</h4>
                <p>{t(
                  "Neben technischen Maßnahmen setzen wir umfassende organisatorische Sicherheitsmaßnahmen um, die den Schutz Ihrer Daten im gesamten Unternehmenskontext gewährleisten:",
                  "In addition to technical measures, we implement comprehensive organizational security measures that ensure the protection of your data throughout the entire business context:"
                )}</p>
                <ul className="space-y-2 ml-1">
                  {[
                    { de: "Dokumentiertes Informationssicherheits-Managementsystem (ISMS) nach ISO 27001", en: "Documented Information Security Management System (ISMS) according to ISO 27001" },
                    { de: "Regelmäßige Schulungen und Sensibilisierung aller Mitarbeiter zum Thema Datenschutz und Informationssicherheit", en: "Regular training and awareness programs for all employees on data protection and information security" },
                    { de: "Vertraulichkeitsvereinbarungen (NDAs) mit allen Mitarbeitern und externen Dienstleistern", en: "Confidentiality agreements (NDAs) with all employees and external service providers" },
                    { de: "Incident-Response-Plan mit definierten Eskalationsstufen und Meldepflichten gemäß Art. 33/34 DSGVO", en: "Incident response plan with defined escalation levels and notification obligations according to Art. 33/34 GDPR" },
                    { de: "Business Continuity Management (BCM) nach ISO 22301 und BSI-Standard 200-4", en: "Business Continuity Management (BCM) according to ISO 22301 and BSI Standard 200-4" },
                    { de: "Regelmäßige Überprüfung und Aktualisierung der Sicherheitsrichtlinien und -prozesse", en: "Regular review and update of security policies and processes" },
                    { de: "Zutrittskontrolle zu Serverräumen und physische Sicherheitsmaßnahmen", en: "Access control to server rooms and physical security measures" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs">{t(item.de, item.en)}</span>
                    </li>
                  ))}
                </ul>

                <h4 className="font-semibold text-foreground pt-2">{t("8.3 Datenschutz durch Technikgestaltung", "8.3 Privacy by Design & Default")}</h4>
                <p>{t(
                  "Gemäß Art. 25 DSGVO berücksichtigen wir den Datenschutz bereits bei der Entwicklung und Gestaltung unserer Tools und Dienste (Privacy by Design). Standardmäßig werden nur die personenbezogenen Daten verarbeitet, die für den jeweiligen Verarbeitungszweck erforderlich sind (Privacy by Default). Dies betrifft den Umfang der erhobenen Daten, den Umfang ihrer Verarbeitung, ihre Speicherfrist und ihre Zugänglichkeit.",
                  "In accordance with Art. 25 GDPR, we consider data protection from the very beginning when developing and designing our tools and services (Privacy by Design). By default, only the personal data necessary for the respective processing purpose is processed (Privacy by Default). This applies to the amount of data collected, the extent of processing, the retention period and accessibility."
                )}</p>

                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-secondary mb-1">{t("Sicherheitsstandards", "Security Standards")}</p>
                  <p className="text-xs">{t(
                    "Unsere Sicherheitsmaßnahmen orientieren sich an den Empfehlungen des BSI (Bundesamt für Sicherheit in der Informationstechnik), den Vorgaben der ISO/IEC 27001:2022, ISO/IEC 27002:2022 sowie den Anforderungen der DSGVO und der NIS2-Richtlinie (EU 2022/2555). Die Wirksamkeit der Maßnahmen wird regelmäßig durch interne und externe Audits überprüft.",
                    "Our security measures are based on recommendations from the BSI (Federal Office for Information Security), the requirements of ISO/IEC 27001:2022, ISO/IEC 27002:2022, and the requirements of the GDPR and the NIS2 Directive (EU 2022/2555). The effectiveness of measures is regularly verified through internal and external audits."
                  )}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 9. Zertifizierungen & Compliance */}
            <AccordionItem value="section-9" id="section-9" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg eu-gradient flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("9. Zertifizierungen und Compliance-Standards", "9. Certifications and Compliance Standards")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "UniqSuite orientiert sich an den höchsten Sicherheits- und Datenschutzstandards. Unsere Tools und Prozesse sind nach folgenden Rahmenwerken ausgerichtet:",
                  "UniqSuite adheres to the highest security and privacy standards. Our tools and processes are aligned with the following frameworks:"
                )}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      titleDe: "DSGVO / GDPR Compliance", titleEn: "GDPR Compliance",
                      descDe: "Vollständige Abdeckung der DSGVO-Anforderungen: Rechtmäßigkeit der Verarbeitung (Art. 6), Informationspflichten (Art. 13/14), automatisierte Entscheidungen (Art. 22), Privacy by Design (Art. 25), Datenschutz-Folgenabschätzung DSFA (Art. 35).",
                      descEn: "Full coverage of GDPR requirements: Lawfulness of processing (Art. 6), information obligations (Art. 13/14), automated decisions (Art. 22), Privacy by Design (Art. 25), Data Protection Impact Assessment DPIA (Art. 35).",
                      tags: ["DSGVO", "DSFA/DPIA", "Art. 6-35"]
                    },
                    {
                      titleDe: "NIS2-Richtlinie (EU 2022/2555)", titleEn: "NIS2 Directive (EU 2022/2555)",
                      descDe: "Vollständige Umsetzung der NIS2-Anforderungen gemäß Art. 21: Risikoanalyse, Incident Management, Business Continuity, Supply-Chain-Sicherheit und Governance-Maßnahmen.",
                      descEn: "Full implementation of NIS2 requirements per Art. 21: Risk analysis, incident management, business continuity, supply chain security and governance measures.",
                      tags: ["NIS2", "Art. 21", "EU 2022/2555"]
                    },
                    {
                      titleDe: "ISO/IEC 27001:2022", titleEn: "ISO/IEC 27001:2022",
                      descDe: "Ausrichtung an allen 93 Annex-A-Controls: Organisatorische Sicherheitsmaßnahmen (A.5-A.8), technische Controls, Zugangssteuerung und kryptografische Maßnahmen.",
                      descEn: "Alignment with all 93 Annex A controls: Organizational security measures (A.5-A.8), technical controls, access management and cryptographic measures.",
                      tags: ["ISO 27001", "Annex A", "ISMS"]
                    },
                    {
                      titleDe: "BSI IT-Grundschutz", titleEn: "BSI IT Baseline Protection",
                      descDe: "Orientierung an den BSI-Standards 200-1 bis 200-4. Systematische Umsetzung des IT-Grundschutz-Kompendiums mit Strukturanalyse, Schutzbedarfsfeststellung und Risikoanalyse.",
                      descEn: "Orientation towards BSI Standards 200-1 to 200-4. Systematic implementation of the IT Baseline Protection Compendium with structural analysis, protection needs assessment and risk analysis.",
                      tags: ["BSI", "200-1 bis 200-4", "Grundschutz"]
                    },
                  ].map((cert, i) => (
                    <div key={i} className="rounded-xl border-2 border-primary/10 bg-card p-5 space-y-3 hover:border-secondary/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-5 w-5 ${i % 2 === 0 ? 'text-primary' : 'text-secondary'}`} />
                        <h4 className="font-bold text-foreground text-sm">{t(cert.titleDe, cert.titleEn)}</h4>
                      </div>
                      <p className="text-xs leading-relaxed">{t(cert.descDe, cert.descEn)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cert.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary border border-primary/15 rounded-full px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 10. Drittanbieter */}
            <AccordionItem value="section-10" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("10. Weitergabe an Dritte und Auftragsverarbeitung", "10. Disclosure to Third Parties and Data Processing")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Eine Übermittlung Ihrer personenbezogenen Daten an Dritte findet grundsätzlich nicht statt, es sei denn, wir sind gesetzlich dazu verpflichtet oder die Datenweitergabe ist zur Erfüllung des Vertragsverhältnisses erforderlich oder Sie haben in die Datenweitergabe zuvor ausdrücklich eingewilligt.",
                  "Your personal data will generally not be transferred to third parties unless we are legally obligated to do so, the transfer is necessary for the performance of the contractual relationship, or you have expressly consented to the transfer."
                )}</p>
                <p>{t(
                  "Soweit wir externe Dienstleister (Auftragsverarbeiter) im Rahmen der Datenverarbeitung einsetzen, wurden mit diesen Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO geschlossen. Unsere Auftragsverarbeiter sind sorgfältig ausgewählt, vertraglich gebunden und werden regelmäßig kontrolliert.",
                  "Insofar as we use external service providers (processors) for data processing, data processing agreements in accordance with Art. 28 GDPR have been concluded with them. Our processors are carefully selected, contractually bound and regularly audited."
                )}</p>
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-secondary mb-1">{t("Hosting & Infrastruktur", "Hosting & Infrastructure")}</p>
                  <p className="text-xs">{t(
                    "UniqSuite wird auf EU-basierten Servern gehostet. Die Datenverarbeitung findet ausschließlich innerhalb der Europäischen Union statt. Ein Transfer in Drittländer findet nicht statt.",
                    "UniqSuite is hosted on EU-based servers. Data processing takes place exclusively within the European Union. There is no transfer to third countries."
                  )}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 11. Änderungen */}
            <AccordionItem value="section-11" className="border-0">
              <AccordionTrigger className="px-6 sm:px-8 py-5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg eu-gradient flex items-center justify-center shrink-0">
                    <FileCheck className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{t("11. Änderungen dieser Datenschutzerklärung", "11. Changes to This Privacy Policy")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-8 pb-6 text-sm text-muted-foreground leading-relaxed space-y-4">
                <p>{t(
                  "Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.",
                  "We reserve the right to adapt this privacy policy so that it always complies with current legal requirements or to implement changes to our services in the privacy policy. The new privacy policy will then apply for your next visit."
                )}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-5 border-t border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-muted-foreground">
            <p>{t("Stand: April 2026", "Last updated: April 2026")}</p>
            <p>© 2026 Cyberwerk. {t("Alle Rechte vorbehalten.", "All rights reserved.")}</p>
          </div>
        </div>
      </main>
      <ScrollToTop />
    </div>
  );
};

export default Datenschutz;
