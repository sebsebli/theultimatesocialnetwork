export interface EmailTemplate {
  subject: string;
  title: string;
  body: string;
  tokenLabel: string;
  ignore: string;
}

export const signInTokenTemplates: Record<string, EmailTemplate> = {
  en: {
    subject: 'Your Sign In Code - Cite System',
    title: 'Sign in to your account',
    body: 'Use the code below to sign in to your Cite System account. This code will expire in 15 minutes.',
    tokenLabel: 'Your Verification Code',
    ignore: "If you didn't request this code, you can safely ignore this email."
  },
  de: {
    subject: 'Ihr Anmeldecode - Cite System',
    title: 'Melden Sie sich an',
    body: 'Verwenden Sie den untenstehenden Code, um sich bei Ihrem Cite System-Konto anzumelden. Dieser Code läuft in 15 Minuten ab.',
    tokenLabel: 'Ihr Verifizierungscode',
    ignore: 'Wenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.'
  },
  fr: {
    subject: 'Votre code de connexion - Cite System',
    title: 'Connectez-vous à votre compte',
    body: 'Utilisez le code ci-dessous pour vous connecter à votre compte Cite System. Ce code expirera dans 15 minutes.',
    tokenLabel: 'Votre code de vérification',
    ignore: 'Si vous n\'avez pas demandé ce code, vous pouvez ignorer cet email.'
  },
  es: {
    subject: 'Tu código de inicio de sesión - Cite System',
    title: 'Inicia sesión en tu cuenta',
    body: 'Usa el código de abajo para iniciar sesión en tu cuenta de Cite System. Este código caducará en 15 minutos.',
    tokenLabel: 'Tu código de verificación',
    ignore: 'Si no solicitaste este código, puedes ignorar este correo electrónico.'
  },
  it: {
    subject: 'Il tuo codice di accesso - Cite System',
    title: 'Accedi al tuo account',
    body: 'Usa il codice qui sotto per accedere al tuo account Cite System. Questo codice scadrà tra 15 minuti.',
    tokenLabel: 'Il tuo codice di verifica',
    ignore: 'Se non hai richiesto questo codice, puoi ignorare questa email.'
  },
  pt: {
    subject: 'Seu código de acesso - Cite System',
    title: 'Entre na sua conta',
    body: 'Use o código abaixo para entrar na sua conta Cite System. Este código expira em 15 minutos.',
    tokenLabel: 'Seu código de verificação',
    ignore: 'Se você não solicitou este código, pode ignorar este e-mail.'
  },
  nl: {
    subject: 'Uw inlogcode - Cite System',
    title: 'Log in op uw account',
    body: 'Gebruik de onderstaande code om in te loggen op uw Cite System-account. Deze code verloopt over 15 minuten.',
    tokenLabel: 'Uw verificatiecode',
    ignore: 'Als u deze code niet heeft aangevraagd, kunt u deze e-mail negeren.'
  },
  pl: {
    subject: 'Twój kod logowania - Cite System',
    title: 'Zaloguj się do swojego konta',
    body: 'Użyj poniższego kodu, aby zalogować się do konta Cite System. Ten kod wygaśnie za 15 minut.',
    tokenLabel: 'Twój kod weryfikacyjny',
    ignore: 'Jeśli nie prosiłeś o ten kod, możesz zignorować tę wiadomość.'
  },
  ru: {
    subject: 'Ваш код входа - Cite System',
    title: 'Войдите в свой аккаунт',
    body: 'Используйте код ниже для входа в аккаунт Cite System. Код действителен 15 минут.',
    tokenLabel: 'Ваш код подтверждения',
    ignore: 'Если вы не запрашивали этот код, просто проигнорируйте это письмо.'
  },
  cs: {
    subject: 'Váš přihlašovací kód - Cite System',
    title: 'Přihlaste se ke svému účtu',
    body: 'Pro přihlášení ke svému účtu Cite System použijte níže uvedený kód. Platnost kódu vyprší za 15 minut.',
    tokenLabel: 'Váš ověřovací kód',
    ignore: 'Pokud jste tento kód nevyžádali, můžete tento e-mail ignorovat.'
  },
  da: {
    subject: 'Din loginkode - Cite System',
    title: 'Log ind på din konto',
    body: 'Brug koden nedenfor til at logge ind på din Cite System-konto. Denne kode udløber om 15 minutter.',
    tokenLabel: 'Din bekræftelseskode',
    ignore: 'Hvis du ikke har anmodet om denne kode, kan du ignorere denne e-mail.'
  },
  fi: {
    subject: 'Kirjautumiskoodisi - Cite System',
    title: 'Kirjaudu tilillesi',
    body: 'Käytä alla olevaa koodia kirjautuaksesi Cite System -tilillesi. Tämä koodi vanhenee 15 minuutissa.',
    tokenLabel: 'Vahvistuskoodisi',
    ignore: 'Jos et pyytänyt tätä koodia, voit jättää tämän sähköpostin huomiotta.'
  },
  hu: {
    subject: 'Bejelentkezési kódja - Cite System',
    title: 'Jelentkezzen be fiókjába',
    body: 'Használja az alábbi kódot a Cite System fiókjába való bejelentkezéshez. Ez a kód 15 perc múlva lejár.',
    tokenLabel: 'Az ellenőrző kódja',
    ignore: 'Ha nem kérte ezt a kódot, nyugodtan figyelmen kívül hagyhatja ezt az e-mailt.'
  },
  no: {
    subject: 'Din påloggingskode - Cite System',
    title: 'Logg på kontoen din',
    body: 'Bruk koden nedenfor for å logge på Cite System-kontoen din. Denne koden utløper om 15 minutter.',
    tokenLabel: 'Din bekreftelseskode',
    ignore: 'Hvis du ikke ba om denne koden, kan du trygt ignorere denne e-posten.'
  },
  sv: {
    subject: 'Din inloggningskod - Cite System',
    title: 'Logga in på ditt konto',
    body: 'Använd koden nedan för att logga in på ditt Cite System-konto. Denna kod går ut om 15 minuter.',
    tokenLabel: 'Din verifieringskod',
    ignore: 'Om du inte begärde denna kod kan du ignorera detta e-postmeddelande.'
  }
};

