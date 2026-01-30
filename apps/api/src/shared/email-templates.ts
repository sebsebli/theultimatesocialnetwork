export interface EmailTemplate {
  subject: string;
  title: string;
  body: string;
  tokenLabel: string;
  ignore: string;
}

export const signInTokenTemplates: Record<string, EmailTemplate> = {
  en: {
    subject: 'Your Cite verification code (expires in 15 min)',
    title: 'Your sign-in code',
    body: 'Enter this code in the app to sign in. It expires in 15 minutes.',
    tokenLabel: 'Your code',
    ignore:
      "If you didn't request this code, you can ignore this email — your account is secure.",
  },
  de: {
    subject: 'Ihr Cite-Verifizierungscode (gültig 15 Min.)',
    title: 'Ihr Code zur Anmeldung',
    body: 'Geben Sie diesen Code in der App ein, um sich anzumelden. Der Code ist 15 Minuten gültig.',
    tokenLabel: 'Ihr Code',
    ignore:
      'Wenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren — Ihr Konto ist sicher.',
  },
  fr: {
    subject: 'Votre code de vérification Cite (valable 15 min)',
    title: 'Votre code de connexion',
    body: "Saisissez ce code dans l'application pour vous connecter. Il expire dans 15 minutes.",
    tokenLabel: 'Votre code',
    ignore:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message — votre compte est sécurisé.",
  },
  es: {
    subject: 'Tu código de verificación de Cite (caduca en 15 min)',
    title: 'Tu código para iniciar sesión',
    body: 'Introduce este código en la app para iniciar sesión. Caduca en 15 minutos.',
    tokenLabel: 'Tu código',
    ignore:
      'Si no has solicitado este código, puedes ignorar este correo; tu cuenta está segura.',
  },
  it: {
    subject: 'Il tuo codice di verifica Cite (scade tra 15 min)',
    title: 'Il tuo codice per accedere',
    body: "Inserisci questo codice nell'app per accedere. Scade tra 15 minuti.",
    tokenLabel: 'Il tuo codice',
    ignore:
      'Se non hai richiesto tu questo codice, puoi ignorare questa email — il tuo account è al sicuro.',
  },
  pt: {
    subject: 'Seu código de verificação Cite (expira em 15 min)',
    title: 'Seu código para entrar',
    body: 'Digite este código no app para entrar. Ele expira em 15 minutos.',
    tokenLabel: 'Seu código',
    ignore:
      'Se você não pediu este código, pode ignorar este e-mail; sua conta está segura.',
  },
  nl: {
    subject: 'Je Cite-verificatiecode (geldig 15 min)',
    title: 'Je inlogcode',
    body: 'Voer deze code in de app in om in te loggen. De code is 15 minuten geldig.',
    tokenLabel: 'Je code',
    ignore:
      'Als je deze code niet hebt aangevraagd, kun je deze e-mail negeren — je account is veilig.',
  },
  pl: {
    subject: 'Twój kod weryfikacyjny Cite (ważny 15 min)',
    title: 'Twój kod do logowania',
    body: 'Wprowadź ten kod w aplikacji, aby się zalogować. Kod jest ważny przez 15 minut.',
    tokenLabel: 'Twój kod',
    ignore:
      'Jeśli nie prosiłeś o ten kod, możesz zignorować tę wiadomość — twoje konto jest bezpieczne.',
  },
  ru: {
    subject: 'Ваш код подтверждения Cite (действует 15 мин)',
    title: 'Ваш код для входа',
    body: 'Введите этот код в приложении, чтобы войти. Код действителен 15 минут.',
    tokenLabel: 'Ваш код',
    ignore:
      'Если вы не запрашивали этот код, проигнорируйте это письмо — ваш аккаунт в безопасности.',
  },
  cs: {
    subject: 'Váš ověřovací kód Cite (platný 15 min)',
    title: 'Váš kód pro přihlášení',
    body: 'Zadejte tento kód v aplikaci pro přihlášení. Platnost kódu vyprší za 15 minut.',
    tokenLabel: 'Váš kód',
    ignore:
      'Pokud jste tento kód nepožádali, můžete tento e-mail ignorovat — váš účet je v bezpečí.',
  },
  da: {
    subject: 'Din Cite-bekræftelseskode (udløber om 15 min)',
    title: 'Din kode til log ind',
    body: 'Indtast denne kode i appen for at logge ind. Koden udløber om 15 minutter.',
    tokenLabel: 'Din kode',
    ignore:
      'Hvis du ikke har anmodet om denne kode, kan du ignorere denne e-mail — din konto er sikker.',
  },
  fi: {
    subject: 'Cite-vahvistuskoodisi (vanhenee 15 min)',
    title: 'Kirjautumiskoodisi',
    body: 'Syötä tämä koodi sovellukseen kirjautuaksesi. Koodi vanhenee 15 minuutissa.',
    tokenLabel: 'Koodisi',
    ignore:
      'Jos et pyytänyt tätä koodia, voit jättää tämän sähköpostin huomiotta — tiliisi on turvassa.',
  },
  hu: {
    subject: 'A Cite ellenőrző kódod (15 percig érvényes)',
    title: 'Bejelentkezési kódod',
    body: 'Add meg ezt a kódot az alkalmazásban a bejelentkezéshez. A kód 15 perc múlva lejár.',
    tokenLabel: 'A kódod',
    ignore:
      'Ha nem te kérted ezt a kódot, nyugodtan figyelmen kívül hagyhatod ezt az e-mailt — a fiókod biztonságban van.',
  },
  no: {
    subject: 'Din Cite-bekreftelseskode (utløper om 15 min)',
    title: 'Din kode for å logge inn',
    body: 'Skriv inn denne koden i appen for å logge inn. Koden utløper om 15 minutter.',
    tokenLabel: 'Din kode',
    ignore:
      'Hvis du ikke ba om denne koden, kan du ignorere denne e-posten — kontoen din er trygg.',
  },
  sv: {
    subject: 'Din Cite-verifieringskod (går ut om 15 min)',
    title: 'Din kod för att logga in',
    body: 'Ange denna kod i appen för att logga in. Koden går ut om 15 minuter.',
    tokenLabel: 'Din kod',
    ignore:
      'Om du inte begärde denna kod kan du ignorera det här e-postmeddelandet — ditt konto är säkert.',
  },
};

export interface InviteCodeTemplate {
  subject: string;
  title: string;
  bodyWithInviter: string;
  bodyGeneric: string;
  codeLabel: string;
  instructions: string;
  footer: string;
}

export const inviteCodeTemplates: Record<string, InviteCodeTemplate> = {
  en: {
    subject: "You're invited to join Cite — here's your invite code",
    title: "You're invited to Cite",
    bodyWithInviter:
      '{{inviterName}} has invited you to join Cite as one of the first beta testers.',
    bodyGeneric:
      "You've been invited to join Cite as one of the first beta testers.",
    codeLabel: 'Your invitation code',
    instructions:
      'Enter this code when you sign up in the Cite app or on the website. The code is single-use, valid for 7 days, and expires if not used in time.',
    footer: "If you didn't expect this email, you can safely ignore it.",
  },
  de: {
    subject: 'Du bist eingeladen, Cite beizutreten',
    title: 'Du bist zu Cite eingeladen',
    bodyWithInviter:
      '{{inviterName}} hat dich eingeladen, Cite als einer der ersten Beta-Tester zu nutzen.',
    bodyGeneric:
      'Du wurdest eingeladen, Cite als einer der ersten Beta-Tester zu nutzen.',
    codeLabel: 'Dein Einladungscode',
    instructions:
      'Gib diesen Code bei der Anmeldung in der Cite-App oder auf der Website ein. Der Code ist einmalig gültig und verfällt, wenn er nicht rechtzeitig genutzt wird.',
    footer:
      'Wenn du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.',
  },
  fr: {
    subject: 'Vous êtes invité à rejoindre Cite',
    title: 'Vous êtes invité sur Cite',
    bodyWithInviter:
      '{{inviterName}} vous a invité à rejoindre Cite parmi les premiers testeurs bêta.',
    bodyGeneric:
      'Vous avez été invité à rejoindre Cite parmi les premiers testeurs bêta.',
    codeLabel: "Votre code d'invitation",
    instructions:
      "Saisissez ce code lors de l'inscription dans l'app Cite ou sur le site. Le code est à usage unique et expirera s'il n'est pas utilisé à temps.",
    footer: "Si vous n'attendiez pas cet e-mail, vous pouvez l'ignorer.",
  },
  es: {
    subject: 'Estás invitado a unirte a Cite',
    title: 'Estás invitado a Cite',
    bodyWithInviter:
      '{{inviterName}} te ha invitado a unirte a Cite como uno de los primeros beta testers.',
    bodyGeneric:
      'Has sido invitado a unirte a Cite como uno de los primeros beta testers.',
    codeLabel: 'Tu código de invitación',
    instructions:
      'Introduce este código al registrarte en la app o en la web de Cite. El código es de un solo uso y caducará si no se usa a tiempo.',
    footer: 'Si no esperabas este correo, puedes ignorarlo.',
  },
  it: {
    subject: 'Sei stato invitato a unirti a Cite',
    title: 'Sei invitato su Cite',
    bodyWithInviter:
      '{{inviterName}} ti ha invitato a unirti a Cite come uno dei primi beta tester.',
    bodyGeneric:
      'Sei stato invitato a unirti a Cite come uno dei primi beta tester.',
    codeLabel: 'Il tuo codice invito',
    instructions:
      "Inserisci questo codice quando ti registri nell'app Cite o sul sito. Il codice è monouso e scadrà se non usato in tempo.",
    footer: 'Se non ti aspettavi questa email, puoi ignorarla.',
  },
  pt: {
    subject: 'Você foi convidado a entrar no Cite',
    title: 'Você está convidado para o Cite',
    bodyWithInviter:
      '{{inviterName}} convidou você para entrar no Cite como um dos primeiros beta testers.',
    bodyGeneric:
      'Você foi convidado a entrar no Cite como um dos primeiros beta testers.',
    codeLabel: 'Seu código de convite',
    instructions:
      'Digite este código ao se cadastrar no app ou no site do Cite. O código é de uso único e expira se não for usado a tempo.',
    footer: 'Se você não esperava este e-mail, pode ignorá-lo.',
  },
  nl: {
    subject: 'Je bent uitgenodigd voor Cite',
    title: 'Je bent uitgenodigd voor Cite',
    bodyWithInviter:
      '{{inviterName}} heeft je uitgenodigd om Cite te joinen als een van de eerste bètatesters.',
    bodyGeneric:
      'Je bent uitgenodigd om Cite te joinen als een van de eerste bètatesters.',
    codeLabel: 'Je uitnodigingscode',
    instructions:
      'Voer deze code in bij het aanmelden in de Cite-app of op de website. De code is eenmalig en verloopt als hij niet op tijd wordt gebruikt.',
    footer: 'Als je deze e-mail niet verwachtte, kun je hem negeren.',
  },
  pl: {
    subject: 'Zostałeś zaproszony do Cite',
    title: 'Jesteś zaproszony do Cite',
    bodyWithInviter:
      '{{inviterName}} zaprosił Cię do Cite jako jednego z pierwszych beta testerów.',
    bodyGeneric:
      'Zostałeś zaproszony do Cite jako jeden z pierwszych beta testerów.',
    codeLabel: 'Twój kod zaproszenia',
    instructions:
      'Wprowadź ten kod przy rejestracji w aplikacji lub na stronie Cite. Kod jest jednorazowy i wygaśnie, jeśli nie zostanie użyty w czasie.',
    footer: 'Jeśli nie spodziewałeś się tego e-maila, możesz go zignorować.',
  },
  ru: {
    subject: 'Вас пригласили в Cite',
    title: 'Вас пригласили в Cite',
    bodyWithInviter:
      '{{inviterName}} пригласил вас присоединиться к Cite в числе первых бета-тестеров.',
    bodyGeneric:
      'Вас пригласили присоединиться к Cite в числе первых бета-тестеров.',
    codeLabel: 'Ваш код приглашения',
    instructions:
      'Введите этот код при регистрации в приложении или на сайте Cite. Код одноразовый и истечёт, если не использовать его вовремя.',
    footer: 'Если вы не ожидали это письмо, можете его проигнорировать.',
  },
  cs: {
    subject: 'Jste zváni do Cite',
    title: 'Jste zváni do Cite',
    bodyWithInviter:
      '{{inviterName}} vás pozval do Cite jako jednoho z prvních beta testerů.',
    bodyGeneric: 'Byli jste pozváni do Cite jako jeden z prvních beta testerů.',
    codeLabel: 'Váš pozvánkový kód',
    instructions:
      'Zadejte tento kód při registraci v aplikaci nebo na webu Cite. Kód je na jedno použití a vyprší, pokud nebude včas použit.',
    footer: 'Pokud jste tento e-mail neočekávali, můžete ho ignorovat.',
  },
  da: {
    subject: 'Du er inviteret til Cite',
    title: 'Du er inviteret til Cite',
    bodyWithInviter:
      '{{inviterName}} har inviteret dig til at deltage i Cite som en af de første beta-testere.',
    bodyGeneric:
      'Du er blevet inviteret til at deltage i Cite som en af de første beta-testere.',
    codeLabel: 'Din invitationskode',
    instructions:
      'Indtast denne kode, når du tilmelder dig i Cite-appen eller på webstedet. Koden kan kun bruges én gang og udløber, hvis den ikke bruges i tide.',
    footer: 'Hvis du ikke forventede denne e-mail, kan du ignorere den.',
  },
  fi: {
    subject: 'Olet kutsuttu Citeen',
    title: 'Olet kutsuttu Citeen',
    bodyWithInviter:
      '{{inviterName}} on kutsunut sinut Citeen yhdeksi ensimmäisistä beetatestääjistä.',
    bodyGeneric:
      'Sinut on kutsuttu Citeen yhdeksi ensimmäisistä beetatestääjistä.',
    codeLabel: 'Kutsukoodisi',
    instructions:
      'Syötä tämä koodi rekisteröityessäsi Cite-sovelluksessa tai verkkosivustolla. Koodi on kertakäyttöinen ja vanhenee, jos sitä ei käytetä ajoissa.',
    footer: 'Jos et odottanut tätä sähköpostia, voit jättää sen huomiotta.',
  },
  hu: {
    subject: 'Meghívtak a Cite használatára',
    title: 'Meghívtak a Cite használatára',
    bodyWithInviter:
      '{{inviterName}} meghívott, hogy csatlakozz a Cite-hez az első béta tesztelők egyikeként.',
    bodyGeneric:
      'Meghívtak, hogy csatlakozz a Cite-hez az első béta tesztelők egyikeként.',
    codeLabel: 'Meghívókódod',
    instructions:
      'Add meg ezt a kódot a Cite alkalmazásban vagy weboldalon történő regisztrációkor. A kód egyszer használható, és lejár, ha nem használod fel időben.',
    footer:
      'Ha nem erre az e-mailre számítottál, nyugodtan figyelmen kívül hagyhatod.',
  },
  no: {
    subject: 'Du er invitert til Cite',
    title: 'Du er invitert til Cite',
    bodyWithInviter:
      '{{inviterName}} har invitert deg til å bli med i Cite som en av de første betatesterne.',
    bodyGeneric:
      'Du er invitert til å bli med i Cite som en av de første betatesterne.',
    codeLabel: 'Din invitasjonskode',
    instructions:
      'Skriv inn denne koden når du registrerer deg i Cite-appen eller på nettsiden. Koden er engangsbruk og utløper hvis den ikke brukes i tide.',
    footer: 'Hvis du ikke forventet denne e-posten, kan du ignorere den.',
  },
  sv: {
    subject: 'Du är inbjuden till Cite',
    title: 'Du är inbjuden till Cite',
    bodyWithInviter:
      '{{inviterName}} har bjudit in dig till Cite som en av de första betatestarna.',
    bodyGeneric:
      'Du har bjudits in till Cite som en av de första betatestarna.',
    codeLabel: 'Din inbjudningskod',
    instructions:
      'Ange denna kod när du registrerar dig i Cite-appen eller på webbplatsen. Koden är engångsbruk och går ut om den inte används i tid.',
    footer:
      'Om du inte förväntade dig det här e-postmeddelandet kan du ignorera det.',
  },
};

export interface AccountDeletionTemplate {
  subject: string;
  title: string;
  body: string;
  buttonLabel: string;
  ignore: string;
}

export const accountDeletionTemplates: Record<string, AccountDeletionTemplate> =
  {
    en: {
      subject: 'Confirm account deletion – Cite',
      title: 'Confirm account deletion',
      body: 'You requested to delete your Cite account. Click the link below to permanently delete it. This link expires in 24 hours.',
      buttonLabel: 'Confirm delete my account',
      ignore:
        "If you didn't request this, you can ignore this email — your account will remain active.",
    },
    de: {
      subject: 'Kontolöschung bestätigen – Cite',
      title: 'Kontolöschung bestätigen',
      body: 'Sie haben die Löschung Ihres Cite-Kontos angefordert. Klicken Sie auf den Link unten, um es dauerhaft zu löschen. Der Link ist 24 Stunden gültig.',
      buttonLabel: 'Kontolöschung bestätigen',
      ignore:
        'Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren — Ihr Konto bleibt aktiv.',
    },
    fr: {
      subject: 'Confirmer la suppression du compte – Cite',
      title: 'Confirmer la suppression du compte',
      body: 'Vous avez demandé la suppression de votre compte Cite. Cliquez sur le lien ci-dessous pour le supprimer définitivement. Ce lien expire dans 24 heures.',
      buttonLabel: 'Confirmer la suppression de mon compte',
      ignore:
        "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail — votre compte restera actif.",
    },
    es: {
      subject: 'Confirmar eliminación de cuenta – Cite',
      title: 'Confirmar eliminación de cuenta',
      body: 'Has solicitado eliminar tu cuenta de Cite. Haz clic en el enlace de abajo para eliminarla permanentemente. El enlace caduca en 24 horas.',
      buttonLabel: 'Confirmar eliminar mi cuenta',
      ignore:
        'Si no has solicitado esto, puedes ignorar este correo; tu cuenta seguirá activa.',
    },
  };

export interface DataExportTemplate {
  subject: string;
  title: string;
  body: string;
  buttonLabel: string;
  ignore: string;
}

export const dataExportTemplates: Record<string, DataExportTemplate> = {
  en: {
    subject: 'Your data export – Cite',
    title: 'Your data export is ready',
    body: 'You requested a copy of your Cite data. Click the button below to download your export (ZIP file). This link expires in 7 days and can only be used once.',
    buttonLabel: 'Download my data',
    ignore:
      "If you didn't request this, you can ignore this email — no export will be sent.",
  },
  de: {
    subject: 'Ihre Datenexport – Cite',
    title: 'Ihr Datenexport ist bereit',
    body: 'Sie haben eine Kopie Ihrer Cite-Daten angefordert. Klicken Sie auf den Button unten, um Ihren Export (ZIP-Datei) herunterzuladen. Der Link ist 7 Tage gültig und kann nur einmal verwendet werden.',
    buttonLabel: 'Meine Daten herunterladen',
    ignore:
      'Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.',
  },
  fr: {
    subject: 'Votre export de données – Cite',
    title: 'Votre export de données est prêt',
    body: "Vous avez demandé une copie de vos données Cite. Cliquez sur le bouton ci-dessous pour télécharger votre export (fichier ZIP). Ce lien expire dans 7 jours et ne peut être utilisé qu'une fois.",
    buttonLabel: 'Télécharger mes données',
    ignore:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
  },
  es: {
    subject: 'Tu exportación de datos – Cite',
    title: 'Tu exportación de datos está lista',
    body: 'Solicitaste una copia de tus datos de Cite. Haz clic en el botón de abajo para descargar tu exportación (archivo ZIP). El enlace caduca en 7 días y solo puede usarse una vez.',
    buttonLabel: 'Descargar mis datos',
    ignore: 'Si no has solicitado esto, puedes ignorar este correo.',
  },
};
