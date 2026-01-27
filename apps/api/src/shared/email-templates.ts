export interface EmailTemplate {
  subject: string;
  title: string;
  body: string;
  tokenLabel: string;
  ignore: string;
}

export const signInTokenTemplates: Record<string, EmailTemplate> = {
  en: {
    subject: 'Your verification code – Cite (expires in 15 min)',
    title: 'Sign in to your account',
    body: 'Use the code below to sign in to your Cite System account. This code will expire in 15 minutes.',
    tokenLabel: 'Your Verification Code',
    ignore:
      "If you didn't request this code, you can safely ignore this email.",
  },
  de: {
    subject: 'Ihr Verifizierungscode – Cite (läuft in 15 Min. ab)',
    title: 'Melden Sie sich an',
    body: 'Verwenden Sie den untenstehenden Code, um sich bei Ihrem Cite System-Konto anzumelden. Dieser Code läuft in 15 Minuten ab.',
    tokenLabel: 'Ihr Verifizierungscode',
    ignore:
      'Wenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.',
  },
  fr: {
    subject: 'Votre code de vérification – Cite (expire dans 15 min)',
    title: 'Connectez-vous à votre compte',
    body: 'Utilisez le code ci-dessous pour vous connecter à votre compte Cite System. Ce code expirera dans 15 minutes.',
    tokenLabel: 'Votre code de vérification',
    ignore:
      "Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.",
  },
  es: {
    subject: 'Tu código de verificación – Cite (caduca en 15 min)',
    title: 'Inicia sesión en tu cuenta',
    body: 'Usa el código de abajo para iniciar sesión en tu cuenta de Cite System. Este código caducará en 15 minutos.',
    tokenLabel: 'Tu código de verificación',
    ignore:
      'Si no solicitaste este código, puedes ignorar este correo electrónico.',
  },
  it: {
    subject: 'Il tuo codice di verifica – Cite (scade tra 15 min)',
    title: 'Accedi al tuo account',
    body: 'Usa il codice qui sotto per accedere al tuo account Cite System. Questo codice scadrà tra 15 minuti.',
    tokenLabel: 'Il tuo codice di verifica',
    ignore: 'Se non hai richiesto questo codice, puoi ignorare questa email.',
  },
  pt: {
    subject: 'Seu código de verificação – Cite (expira em 15 min)',
    title: 'Entre na sua conta',
    body: 'Use o código abaixo para entrar na sua conta Cite System. Este código expira em 15 minutos.',
    tokenLabel: 'Seu código de verificação',
    ignore: 'Se você não solicitou este código, pode ignorar este e-mail.',
  },
  nl: {
    subject: 'Uw verificatiecode – Cite (verloopt over 15 min)',
    title: 'Log in op uw account',
    body: 'Gebruik de onderstaande code om in te loggen op uw Cite System-account. Deze code verloopt over 15 minuten.',
    tokenLabel: 'Uw verificatiecode',
    ignore:
      'Als u deze code niet heeft aangevraagd, kunt u deze e-mail negeren.',
  },
  pl: {
    subject: 'Twój kod weryfikacyjny – Cite (wygasa za 15 min)',
    title: 'Zaloguj się do swojego konta',
    body: 'Użyj poniższego kodu, aby zalogować się do konta Cite System. Ten kod wygaśnie za 15 minut.',
    tokenLabel: 'Twój kod weryfikacyjny',
    ignore: 'Jeśli nie prosiłeś o ten kod, możesz zignorować tę wiadomość.',
  },
  ru: {
    subject: 'Ваш код подтверждения – Cite (действует 15 мин)',
    title: 'Войдите в свой аккаунт',
    body: 'Используйте код ниже для входа в аккаунт Cite System. Код действителен 15 минут.',
    tokenLabel: 'Ваш код подтверждения',
    ignore:
      'Если вы не запрашивали этот код, просто проигнорируйте это письмо.',
  },
  cs: {
    subject: 'Váš ověřovací kód – Cite (vyprší za 15 min)',
    title: 'Přihlaste se ke svému účtu',
    body: 'Pro přihlášení ke svému účtu Cite System použijte níže uvedený kód. Platnost kódu vyprší za 15 minut.',
    tokenLabel: 'Váš ověřovací kód',
    ignore: 'Pokud jste tento kód nevyžádali, můžete tento e-mail ignorovat.',
  },
  da: {
    subject: 'Din bekræftelseskode – Cite (udløber om 15 min)',
    title: 'Log ind på din konto',
    body: 'Brug koden nedenfor til at logge ind på din Cite System-konto. Denne kode udløber om 15 minutter.',
    tokenLabel: 'Din bekræftelseskode',
    ignore:
      'Hvis du ikke har anmodet om denne kode, kan du ignorere denne e-mail.',
  },
  fi: {
    subject: 'Vahvistuskoodisi – Cite (vanhenee 15 min)',
    title: 'Kirjaudu tilillesi',
    body: 'Käytä alla olevaa koodia kirjautuaksesi Cite System -tilillesi. Tämä koodi vanhenee 15 minuutissa.',
    tokenLabel: 'Vahvistuskoodisi',
    ignore:
      'Jos et pyytänyt tätä koodia, voit jättää tämän sähköpostin huomiotta.',
  },
  hu: {
    subject: 'Az ellenőrző kódja – Cite (15 perc múlva lejár)',
    title: 'Jelentkezzen be fiókjába',
    body: 'Használja az alábbi kódot a Cite System fiókjába való bejelentkezéshez. Ez a kód 15 perc múlva lejár.',
    tokenLabel: 'Az ellenőrző kódja',
    ignore:
      'Ha nem kérte ezt a kódot, nyugodtan figyelmen kívül hagyhatja ezt az e-mailt.',
  },
  no: {
    subject: 'Din bekreftelseskode – Cite (utløper om 15 min)',
    title: 'Logg på kontoen din',
    body: 'Bruk koden nedenfor for å logge på Cite System-kontoen din. Denne koden utløper om 15 minutter.',
    tokenLabel: 'Din bekreftelseskode',
    ignore:
      'Hvis du ikke ba om denne koden, kan du trygt ignorere denne e-posten.',
  },
  sv: {
    subject: 'Din verifieringskod – Cite (går ut om 15 min)',
    title: 'Logga in på ditt konto',
    body: 'Använd koden nedan för att logga in på ditt Cite System-konto. Denna kod går ut om 15 minuter.',
    tokenLabel: 'Din verifieringskod',
    ignore:
      'Om du inte begärde denna kod kan du ignorera detta e-postmeddelande.',
  },
};

export interface InviteCodeTemplate {
  subject: string;
  title: string;
  body: string;
  footer: string;
}

export const inviteCodeTemplates: Record<string, InviteCodeTemplate> = {
  en: {
    subject: 'Your Cite invite code',
    title: 'Your invite code',
    body: 'Use this code when signing up. It’s single-use and can only be claimed once.',
    footer: "If you didn't request this code, you can ignore this email.",
  },
  de: {
    subject: 'Dein Cite-Einladungscode',
    title: 'Dein Einladungscode',
    body: 'Verwende diesen Code bei der Registrierung. Er ist einmalig und kann nur einmal eingelöst werden.',
    footer:
      'Wenn du diesen Code nicht angefordert hast, kannst du diese E-Mail ignorieren.',
  },
  fr: {
    subject: "Votre code d'invitation Cite",
    title: "Votre code d'invitation",
    body: "Utilisez ce code lors de l'inscription. Il est à usage unique et ne peut être utilisé qu'une seule fois.",
    footer:
      "Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail.",
  },
  es: {
    subject: 'Tu código de invitación de Cite',
    title: 'Tu código de invitación',
    body: 'Usa este código al registrarte. Es de un solo uso y solo puede canjearse una vez.',
    footer: 'Si no solicitaste este código, puedes ignorar este correo.',
  },
  it: {
    subject: 'Il tuo codice invito Cite',
    title: 'Il tuo codice invito',
    body: 'Usa questo codice durante la registrazione. È monouso e può essere riscattato una sola volta.',
    footer: 'Se non hai richiesto questo codice, puoi ignorare questa email.',
  },
  pt: {
    subject: 'Seu código de convite Cite',
    title: 'Seu código de convite',
    body: 'Use este código ao se cadastrar. É de uso único e só pode ser resgatado uma vez.',
    footer: 'Se você não solicitou este código, pode ignorar este e-mail.',
  },
  nl: {
    subject: 'Je Cite-uitnodigingscode',
    title: 'Je uitnodigingscode',
    body: 'Gebruik deze code bij het aanmelden. Hij is eenmalig en kan maar één keer worden ingewisseld.',
    footer:
      'Als je deze code niet hebt aangevraagd, kun je deze e-mail negeren.',
  },
  pl: {
    subject: 'Twój kod zaproszenia Cite',
    title: 'Twój kod zaproszenia',
    body: 'Użyj tego kodu przy rejestracji. Jest jednorazowy i można go wykorzystać tylko raz.',
    footer: 'Jeśli nie prosiłeś o ten kod, możesz zignorować tę wiadomość.',
  },
  ru: {
    subject: 'Ваш код приглашения Cite',
    title: 'Ваш код приглашения',
    body: 'Используйте этот код при регистрации. Он одноразовый и может быть использован только один раз.',
    footer:
      'Если вы не запрашивали этот код, можете проигнорировать это письмо.',
  },
  cs: {
    subject: 'Váš pozvánkový kód Cite',
    title: 'Váš pozvánkový kód',
    body: 'Použijte tento kód při registraci. Je na jedno použití a lze jej uplatnit pouze jednou.',
    footer: 'Pokud jste tento kód nevyžádali, můžete tento e-mail ignorovat.',
  },
  da: {
    subject: 'Din Cite-invitationskode',
    title: 'Din invitationskode',
    body: 'Brug denne kode ved tilmelding. Den er til engangsbrug og kan kun indløses én gang.',
    footer:
      'Hvis du ikke har anmodet om denne kode, kan du ignorere denne e-mail.',
  },
  fi: {
    subject: 'Cite-kutsukoodisi',
    title: 'Kutsukoodisi',
    body: 'Käytä tätä koodia rekisteröityessäsi. Se on kertakäyttöinen ja voi lunastaa vain kerran.',
    footer:
      'Jos et pyytänyt tätä koodia, voit jättää tämän sähköpostin huomiotta.',
  },
  hu: {
    subject: 'Cite meghívókódod',
    title: 'Meghívókódod',
    body: 'Használd ezt a kódot regisztrációkor. Egyszer használható és csak egyszer vonható be.',
    footer:
      'Ha nem kérte ezt a kódot, nyugodtan figyelmen kívül hagyhatja ezt az e-mailt.',
  },
  no: {
    subject: 'Din Cite-invitasjonskode',
    title: 'Din invitasjonskode',
    body: 'Bruk denne koden ved registrering. Den er engangsbruk og kan bare løses inn én gang.',
    footer: 'Hvis du ikke ba om denne koden, kan du ignorere denne e-posten.',
  },
  sv: {
    subject: 'Din Cite-inbjudningskod',
    title: 'Din inbjudningskod',
    body: 'Använd denna kod vid registrering. Den är engångsbruk och kan bara lösas in en gång.',
    footer:
      'Om du inte begärde denna kod kan du ignorera detta e-postmeddelande.',
  },
};
