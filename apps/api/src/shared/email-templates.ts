export interface EmailTemplate {
  subject: string;
  title: string;
  body: string;
  tokenLabel: string;
  ignore: string;
}

export const signInTokenTemplates: Record<string, EmailTemplate> = {
  en: {
    subject: 'Sign in to Citewalk',
    title: 'Sign in',
    body: 'Enter this code to sign in to your account. It is valid for 15 minutes.',
    tokenLabel: 'Verification Code',
    ignore: 'If you did not request this, you can safely ignore this message.',
  },
  de: {
    subject: 'Anmeldung bei Citewalk',
    title: 'Anmelden',
    body: 'Geben Sie diesen Code ein, um sich anzumelden. Er ist 15 Minuten gültig.',
    tokenLabel: 'Verifizierungscode',
    ignore:
      'Wenn Sie dies nicht angefordert haben, können Sie diese Nachricht ignorieren.',
  },
  fr: {
    subject: 'Connexion à Citewalk',
    title: 'Se connecter',
    body: 'Saisissez ce code pour vous connecter. Il est valide pendant 15 minutes.',
    tokenLabel: 'Code de vérification',
    ignore: "Si vous n'avez pas demandé cela, vous pouvez ignorer ce message.",
  },
  es: {
    subject: 'Iniciar sesión en Citewalk',
    title: 'Iniciar sesión',
    body: 'Introduce este código para iniciar sesión. Es válido durante 15 minutos.',
    tokenLabel: 'Código de verificación',
    ignore: 'Si no has solicitado esto, puedes ignorar este mensaje.',
  },
  it: {
    subject: 'Accedi a Citewalk',
    title: 'Accedi',
    body: 'Inserisci questo codice per accedere. È valido per 15 minuti.',
    tokenLabel: 'Codice di verifica',
    ignore: 'Se non hai richiesto questo, puoi ignorare questo messaggio.',
  },
  pt: {
    subject: 'Entrar no Citewalk',
    title: 'Entrar',
    body: 'Digite este código para entrar. Válido por 15 minutos.',
    tokenLabel: 'Código de verificação',
    ignore: 'Se você não solicitou isso, pode ignorar esta mensagem.',
  },
  nl: {
    subject: 'Inloggen bij Citewalk',
    title: 'Inloggen',
    body: 'Voer deze code in om in te loggen. De code is 15 minuten geldig.',
    tokenLabel: 'Verificatiecode',
    ignore: 'Als u dit niet heeft aangevraagd, kunt u dit bericht negeren.',
  },
  pl: {
    subject: 'Zaloguj się do Citewalk',
    title: 'Zaloguj się',
    body: 'Wprowadź ten kod, aby się zalogować. Jest ważny przez 15 minut.',
    tokenLabel: 'Kod weryfikacyjny',
    ignore: 'Jeśli tego nie zażądałeś, możesz zignorować tę wiadomość.',
  },
  ru: {
    subject: 'Вход в Citewalk',
    title: 'Войти',
    body: 'Введите этот код для входа. Он действителен 15 минут.',
    tokenLabel: 'Код подтверждения',
    ignore:
      'Если вы этого не запрашивали, можете проигнорировать это сообщение.',
  },
  cs: {
    subject: 'Přihlášení do Citewalk',
    title: 'Přihlásit se',
    body: 'Zadejte tento kód pro přihlášení. Platí 15 minut.',
    tokenLabel: 'Ověřovací kód',
    ignore: 'Pokud jste o to nežádali, můžete tuto zprávu ignorovat.',
  },
  da: {
    subject: 'Log ind på Citewalk',
    title: 'Log ind',
    body: 'Indtast denne kode for at logge ind. Den er gyldig i 15 minutter.',
    tokenLabel: 'Bekræftelseskode',
    ignore: 'Hvis du ikke har anmodet om dette, kan du ignorere denne besked.',
  },
  fi: {
    subject: 'Kirjaudu Citewalkiin',
    title: 'Kirjaudu sisään',
    body: 'Syötä tämä koodi kirjautuaksesi. Se on voimassa 15 minuuttia.',
    tokenLabel: 'Vahvistuskoodi',
    ignore: 'Jos et pyytänyt tätä, voit jättää tämän viestin huomiotta.',
  },
  hu: {
    subject: 'Bejelentkezés a Citewalkba',
    title: 'Bejelentkezés',
    body: 'Add meg ezt a kódot a bejelentkezéshez. 15 percig érvényes.',
    tokenLabel: 'Ellenőrző kód',
    ignore: 'Ha nem te kérted, figyelmen kívül hagyhatod ezt az üzenetet.',
  },
  no: {
    subject: 'Logg inn på Citewalk',
    title: 'Logg inn',
    body: 'Skriv inn denne koden for å logge inn. Den er gyldig i 15 minutter.',
    tokenLabel: 'Bekreftelseskode',
    ignore: 'Hvis du ikke ba om dette, kan du ignorere denne meldingen.',
  },
  sv: {
    subject: 'Logga in på Citewalk',
    title: 'Logga in',
    body: 'Ange denna kod för att logga in. Den är giltig i 15 minuter.',
    tokenLabel: 'Verifieringskod',
    ignore: 'Om du inte begärde detta kan du ignorera detta meddelande.',
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
    subject: 'You have been invited to Citewalk',
    title: 'Invitation',
    bodyWithInviter: '{{inviterName}} has invited you to join Citewalk.',
    bodyGeneric: 'You have been invited to join Citewalk.',
    codeLabel: 'Access Code',
    instructions:
      'Use this code to create your account. The code is single-use and valid for 7 days.',
    footer: 'If you did not expect this, you can safely ignore it.',
  },
  de: {
    subject: 'Einladung zu Citewalk',
    title: 'Einladung',
    bodyWithInviter: '{{inviterName}} hat Sie zu Citewalk eingeladen.',
    bodyGeneric: 'Sie wurden zu Citewalk eingeladen.',
    codeLabel: 'Zugangscode',
    instructions:
      'Verwenden Sie diesen Code, um Ihr Konto zu erstellen. Der Code ist einmalig verwendbar und 7 Tage gültig.',
    footer: 'Wenn Sie dies nicht erwartet haben, können Sie es ignorieren.',
  },
  fr: {
    subject: 'Invitation à Citewalk',
    title: 'Invitation',
    bodyWithInviter: '{{inviterName}} vous a invité à rejoindre Citewalk.',
    bodyGeneric: 'Vous avez été invité à rejoindre Citewalk.',
    codeLabel: "Code d'accès",
    instructions:
      'Utilisez ce code pour créer votre compte. Le code est à usage unique et valable 7 jours.',
    footer: "Si vous ne vous y attendiez pas, vous pouvez l'ignorer.",
  },
  es: {
    subject: 'Invitación a Citewalk',
    title: 'Invitación',
    bodyWithInviter: '{{inviterName}} te ha invitado a unirte a Citewalk.',
    bodyGeneric: 'Has sido invitado a unirte a Citewalk.',
    codeLabel: 'Código de acceso',
    instructions:
      'Utiliza este código para crear tu cuenta. El código es de un solo uso y válido por 7 días.',
    footer: 'Si no esperabas esto, puedes ignorarlo.',
  },
  it: {
    subject: 'Invito a Citewalk',
    title: 'Invito',
    bodyWithInviter: '{{inviterName}} ti ha invitato a unirti a Citewalk.',
    bodyGeneric: 'Sei stato invitato a unirti a Citewalk.',
    codeLabel: 'Codice di accesso',
    instructions:
      'Usa questo codice per creare il tuo account. Il codice è monouso e valido per 7 giorni.',
    footer: 'Se non te lo aspettavi, puoi ignorarlo.',
  },
  pt: {
    subject: 'Convite para Citewalk',
    title: 'Convite',
    bodyWithInviter: '{{inviterName}} convidou você para o Citewalk.',
    bodyGeneric: 'Você foi convidado para o Citewalk.',
    codeLabel: 'Código de acesso',
    instructions:
      'Use este código para criar sua conta. O código é de uso único e válido por 7 dias.',
    footer: 'Se você não esperava por isso, pode ignorar.',
  },
  nl: {
    subject: 'Uitnodiging voor Citewalk',
    title: 'Uitnodiging',
    bodyWithInviter: '{{inviterName}} heeft u uitgenodigd voor Citewalk.',
    bodyGeneric: 'U bent uitgenodigd voor Citewalk.',
    codeLabel: 'Toegangscode',
    instructions:
      'Gebruik deze code om uw account aan te maken. De code is eenmalig en 7 dagen geldig.',
    footer: 'Als u dit niet verwachtte, kunt u het negeren.',
  },
  pl: {
    subject: 'Zaproszenie do Citewalk',
    title: 'Zaproszenie',
    bodyWithInviter: '{{inviterName}} zaprosił Cię do Citewalk.',
    bodyGeneric: 'Zostałeś zaproszony do Citewalk.',
    codeLabel: 'Kod dostępu',
    instructions:
      'Użyj tego kodu, aby utworzyć konto. Kod jest jednorazowy i ważny przez 7 dni.',
    footer: 'Jeśli się tego nie spodziewałeś, możesz to zignorować.',
  },
  ru: {
    subject: 'Приглашение в Citewalk',
    title: 'Приглашение',
    bodyWithInviter: '{{inviterName}} пригласил вас в Citewalk.',
    bodyGeneric: 'Вас пригласили в Citewalk.',
    codeLabel: 'Код доступа',
    instructions:
      'Используйте этот код для создания аккаунта. Код одноразовый и действителен 7 дней.',
    footer: 'Если вы этого не ожидали, можете проигнорировать.',
  },
  cs: {
    subject: 'Pozvánka do Citewalk',
    title: 'Pozvánka',
    bodyWithInviter: '{{inviterName}} vás pozval do Citewalk.',
    bodyGeneric: 'Byli jste pozváni do Citewalk.',
    codeLabel: 'Přístupový kód',
    instructions:
      'Použijte tento kód k vytvoření účtu. Kód je jednorázový a platí 7 dní.',
    footer: 'Pokud jste to neočekávali, můžete to ignorovat.',
  },
  da: {
    subject: 'Invitation til Citewalk',
    title: 'Invitation',
    bodyWithInviter: '{{inviterName}} har inviteret dig til Citewalk.',
    bodyGeneric: 'Du er blevet inviteret til Citewalk.',
    codeLabel: 'Adgangskode',
    instructions:
      'Brug denne kode til at oprette din konto. Koden er til engangsbrug og gyldig i 7 dage.',
    footer: 'Hvis du ikke forventede dette, kan du ignorere det.',
  },
  fi: {
    subject: 'Kutsu Citewalkiin',
    title: 'Kutsu',
    bodyWithInviter: '{{inviterName}} on kutsunut sinut Citewalkiin.',
    bodyGeneric: 'Sinut on kutsuttu Citewalkiin.',
    codeLabel: 'Pääsykoodi',
    instructions:
      'Käytä tätä koodia tilisi luomiseen. Koodi on kertakäyttöinen ja voimassa 7 päivää.',
    footer: 'Jos et odottanut tätä, voit jättää sen huomiotta.',
  },
  hu: {
    subject: 'Meghívó a Citewalkba',
    title: 'Meghívó',
    bodyWithInviter: '{{inviterName}} meghívott a Citewalkba.',
    bodyGeneric: 'Meghívtak a Citewalkba.',
    codeLabel: 'Hozzáférési kód',
    instructions:
      'Használd ezt a kódot a fiókod létrehozásához. A kód egyszer használható és 7 napig érvényes.',
    footer: 'Ha nem számítottál erre, figyelmen kívül hagyhatod.',
  },
  no: {
    subject: 'Invitasjon til Citewalk',
    title: 'Invitasjon',
    bodyWithInviter: '{{inviterName}} har invitert deg til Citewalk.',
    bodyGeneric: 'Du er invitert til Citewalk.',
    codeLabel: 'Tilgangskode',
    instructions:
      'Bruk denne koden for å opprette kontoen din. Koden er til engangsbruk og gyldig i 7 dager.',
    footer: 'Hvis du ikke forventet dette, kan du ignorere det.',
  },
  sv: {
    subject: 'Inbjudan till Citewalk',
    title: 'Inbjudan',
    bodyWithInviter: '{{inviterName}} har bjudit in dig till Citewalk.',
    bodyGeneric: 'Du har bjudits in till Citewalk.',
    codeLabel: 'Åtkomstkod',
    instructions:
      'Använd denna kod för att skapa ditt konto. Koden är för engångsbruk och giltig i 7 dagar.',
    footer: 'Om du inte förväntade dig detta kan du ignorera det.',
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
      subject: 'Confirm Account Deletion',
      title: 'Delete Account',
      body: 'You requested to delete your Citewalk account. Click the link below to permanently delete your data. This link expires in 24 hours.',
      buttonLabel: 'Delete My Account',
      ignore: 'If you did not request this, you can ignore this email.',
    },
    de: {
      subject: 'Kontolöschung bestätigen',
      title: 'Konto löschen',
      body: 'Sie haben die Löschung Ihres Citewalk-Kontos angefordert. Klicken Sie auf den Link unten, um Ihre Daten dauerhaft zu löschen. Der Link ist 24 Stunden gültig.',
      buttonLabel: 'Mein Konto löschen',
      ignore:
        'Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.',
    },
    fr: {
      subject: 'Confirmer la suppression du compte',
      title: 'Supprimer le compte',
      body: 'Vous avez demandé la suppression de votre compte Citewalk. Cliquez sur le lien ci-dessous pour supprimer définitivement vos données. Ce lien expire dans 24 heures.',
      buttonLabel: 'Supprimer mon compte',
      ignore:
        "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
    },
    es: {
      subject: 'Confirmar eliminación de cuenta',
      title: 'Eliminar cuenta',
      body: 'Has solicitado eliminar tu cuenta de Citewalk. Haz clic en el enlace de abajo para eliminar permanentemente tus datos. El enlace caduca en 24 horas.',
      buttonLabel: 'Eliminar mi cuenta',
      ignore: 'Si no has solicitado esto, puedes ignorar este correo.',
    },
    it: {
      subject: 'Conferma eliminazione account',
      title: 'Elimina account',
      body: 'Hai richiesto di eliminare il tuo account Citewalk. Clicca sul link qui sotto per eliminare definitivamente i tuoi dati. Questo link scade in 24 ore.',
      buttonLabel: 'Elimina il mio account',
      ignore: 'Se non hai richiesto questo, puoi ignorare questa email.',
    },
    pt: {
      subject: 'Confirmar exclusão de conta',
      title: 'Excluir conta',
      body: 'Você solicitou excluir sua conta Citewalk. Clique no link abaixo para excluir permanentemente seus dados. Este link expira em 24 horas.',
      buttonLabel: 'Excluir minha conta',
      ignore: 'Se você não solicitou isso, pode ignorar este e-mail.',
    },
    nl: {
      subject: 'Bevestig accountverwijdering',
      title: 'Account verwijderen',
      body: 'U heeft verzocht uw Citewalk-account te verwijderen. Klik op de onderstaande link om uw gegevens permanent te verwijderen. Deze link verloopt over 24 uur.',
      buttonLabel: 'Mijn account verwijderen',
      ignore: 'Als u dit niet heeft aangevraagd, kunt u deze e-mail negeren.',
    },
    pl: {
      subject: 'Potwierdź usunięcie konta',
      title: 'Usuń konto',
      body: 'Zażądałeś usunięcia swojego konta Citewalk. Kliknij poniższy link, aby trwale usunąć swoje dane. Link wygasa za 24 godziny.',
      buttonLabel: 'Usuń moje konto',
      ignore: 'Jeśli tego nie zażądałeś, możesz zignorować ten e-mail.',
    },
    ru: {
      subject: 'Подтвердите удаление аккаунта',
      title: 'Удалить аккаунт',
      body: 'Вы запросили удаление вашего аккаунта Citewalk. Нажмите на ссылку ниже, чтобы навсегда удалить ваши данные. Ссылка действительна 24 часа.',
      buttonLabel: 'Удалить мой аккаунт',
      ignore:
        'Если вы этого не запрашивали, можете проигнорировать это письмо.',
    },
    cs: {
      subject: 'Potvrdit smazání účtu',
      title: 'Smazat účet',
      body: 'Požádali jste o smazání vašeho účtu Citewalk. Kliknutím na odkaz níže trvale smažete svá data. Odkaz vyprší za 24 hodin.',
      buttonLabel: 'Smazat můj účet',
      ignore: 'Pokud jste o to nežádali, můžete tento e-mail ignorovat.',
    },
    da: {
      subject: 'Bekræft sletning af konto',
      title: 'Slet konto',
      body: 'Du har anmodet om at slette din Citewalk-konto. Klik på linket nedenfor for at slette dine data permanent. Dette link udløber om 24 timer.',
      buttonLabel: 'Slet min konto',
      ignore:
        'Hvis du ikke har anmodet om dette, kan du ignorere denne e-mail.',
    },
    fi: {
      subject: 'Vahvista tilin poisto',
      title: 'Poista tili',
      body: 'Olet pyytänyt Citewalk-tilisi poistamista. Napsauta alla olevaa linkkiä poistaaksesi tietosi pysyvästi. Linkki vanhenee 24 tunnissa.',
      buttonLabel: 'Poista tilini',
      ignore: 'Jos et pyytänyt tätä, voit jättää tämän sähköpostin huomiotta.',
    },
    hu: {
      subject: 'Fiók törlésének megerősítése',
      title: 'Fiók törlése',
      body: 'Kérted a Citewalk fiókod törlését. Kattints az alábbi linkre az adataid végleges törléséhez. A link 24 óráig érvényes.',
      buttonLabel: 'Fiókom törlése',
      ignore: 'Ha nem te kérted, figyelmen kívül hagyhatod ezt az e-mailt.',
    },
    no: {
      subject: 'Bekreft sletting av konto',
      title: 'Slett konto',
      body: 'Du har bedt om å slette Citewalk-kontoen din. Klikk på lenken nedenfor for å slette dataene dine permanent. Denne lenken utløper om 24 timer.',
      buttonLabel: 'Slett min konto',
      ignore: 'Hvis du ikke ba om dette, kan du ignorere denne e-posten.',
    },
    sv: {
      subject: 'Bekräfta borttagning av konto',
      title: 'Ta bort konto',
      body: 'Du har begärt att ta bort ditt Citewalk-konto. Klicka på länken nedan för att permanent radera dina data. Länken går ut om 24 timmar.',
      buttonLabel: 'Ta bort mitt konto',
      ignore:
        'Om du inte begärde detta kan du ignorera det här e-postmeddelandet.',
    },
  };

export interface EmailChangeTemplate {
  subject: string;
  title: string;
  body: string;
  buttonLabel: string;
  ignore: string;
}

export const emailChangeTemplates: Record<string, EmailChangeTemplate> = {
  en: {
    subject: 'Confirm New Email Address',
    title: 'Change Email',
    body: 'You requested to change your Citewalk account email to this address. Click the link below to confirm. This link expires in 24 hours.',
    buttonLabel: 'Confirm New Email',
    ignore: 'If you did not request this, you can ignore this email.',
  },
  de: {
    subject: 'Neue E-Mail-Adresse bestätigen',
    title: 'E-Mail ändern',
    body: 'Sie haben angefordert, die E-Mail-Adresse Ihres Citewalk-Kontos zu ändern. Klicken Sie auf den Link unten zur Bestätigung. Der Link ist 24 Stunden gültig.',
    buttonLabel: 'Neue E-Mail bestätigen',
    ignore:
      'Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.',
  },
  fr: {
    subject: 'Confirmer la nouvelle adresse e-mail',
    title: "Changer l'e-mail",
    body: "Vous avez demandé à changer l'adresse e-mail de votre compte Citewalk. Cliquez sur le lien ci-dessous pour confirmer. Ce lien expire dans 24 heures.",
    buttonLabel: 'Confirmer la nouvelle adresse',
    ignore:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
  },
  es: {
    subject: 'Confirmar nueva dirección de correo',
    title: 'Cambiar correo',
    body: 'Has solicitado cambiar el correo de tu cuenta Citewalk. Haz clic en el enlace de abajo para confirmar. El enlace caduca en 24 horas.',
    buttonLabel: 'Confirmar nuevo correo',
    ignore: 'Si no has solicitado esto, puedes ignorar este correo.',
  },
  it: {
    subject: 'Conferma nuovo indirizzo email',
    title: 'Cambia email',
    body: "Hai richiesto di cambiare l'email del tuo account Citewalk. Clicca sul link qui sotto per confermare. Questo link scade in 24 ore.",
    buttonLabel: 'Conferma nuova email',
    ignore: 'Se non hai richiesto questo, puoi ignorare questa email.',
  },
  pt: {
    subject: 'Confirmar novo endereço de e-mail',
    title: 'Alterar e-mail',
    body: 'Você solicitou alterar o e-mail da sua conta Citewalk. Clique no link abaixo para confirmar. Este link expira em 24 horas.',
    buttonLabel: 'Confirmar novo e-mail',
    ignore: 'Se você não solicitou isso, pode ignorar este e-mail.',
  },
  nl: {
    subject: 'Bevestig nieuw e-mailadres',
    title: 'E-mail wijzigen',
    body: 'U heeft verzocht het e-mailadres van uw Citewalk-account te wijzigen. Klik op de onderstaande link om te bevestigen. Deze link verloopt over 24 uur.',
    buttonLabel: 'Nieuw e-mailadres bevestigen',
    ignore: 'Als u dit niet heeft aangevraagd, kunt u deze e-mail negeren.',
  },
  pl: {
    subject: 'Potwierdź nowy adres e-mail',
    title: 'Zmień e-mail',
    body: 'Zażądałeś zmiany adresu e-mail swojego konta Citewalk. Kliknij poniższy link, aby potwierdzić. Link wygasa za 24 godziny.',
    buttonLabel: 'Potwierdź nowy e-mail',
    ignore: 'Jeśli tego nie zażądałeś, możesz zignorować ten e-mail.',
  },
  ru: {
    subject: 'Подтвердите новый адрес электронной почты',
    title: 'Изменить email',
    body: 'Вы запросили смену email вашего аккаунта Citewalk. Нажмите на ссылку ниже для подтверждения. Ссылка действительна 24 часа.',
    buttonLabel: 'Подтвердить новый email',
    ignore: 'Если вы этого не запрашивали, можете проигнорировать это письмо.',
  },
  cs: {
    subject: 'Potvrdit novou e-mailovou adresu',
    title: 'Změnit e-mail',
    body: 'Požádali jste o změnu e-mailu vašeho účtu Citewalk. Klikněte na odkaz níže pro potvrzení. Odkaz vyprší za 24 hodin.',
    buttonLabel: 'Potvrdit nový e-mail',
    ignore: 'Pokud jste o to nežádali, můžete tento e-mail ignorovat.',
  },
  da: {
    subject: 'Bekræft ny e-mailadresse',
    title: 'Skift e-mail',
    body: 'Du har anmodet om at ændre e-mailadressen på din Citewalk-konto. Klik på linket nedenfor for at bekræfte. Dette link udløber om 24 timer.',
    buttonLabel: 'Bekræft ny e-mail',
    ignore: 'Hvis du ikke har anmodet om dette, kan du ignorere denne e-mail.',
  },
  fi: {
    subject: 'Vahvista uusi sähköpostiosoite',
    title: 'Vaihda sähköposti',
    body: 'Olet pyytänyt Citewalk-tilisi sähköpostiosoitteen vaihtamista. Napsauta alla olevaa linkkiä vahvistaaksesi. Linkki vanhenee 24 tunnissa.',
    buttonLabel: 'Vahvista uusi sähköposti',
    ignore: 'Jos et pyytänyt tätä, voit jättää tämän sähköpostin huomiotta.',
  },
  hu: {
    subject: 'Új e-mail cím megerősítése',
    title: 'E-mail módosítása',
    body: 'Kérted a Citewalk fiókod e-mail címének megváltoztatását. Kattints az alábbi linkre a megerősítéshez. A link 24 óráig érvényes.',
    buttonLabel: 'Új e-mail megerősítése',
    ignore: 'Ha nem te kérted, figyelmen kívül hagyhatod ezt az e-mailt.',
  },
  no: {
    subject: 'Bekreft ny e-postadresse',
    title: 'Endre e-post',
    body: 'Du har bedt om å endre e-postadressen til Citewalk-kontoen din. Klikk på lenken nedenfor for å bekrefte. Denne lenken utløper om 24 timer.',
    buttonLabel: 'Bekreft ny e-post',
    ignore: 'Hvis du ikke ba om dette, kan du ignorere denne e-posten.',
  },
  sv: {
    subject: 'Bekräfta ny e-postadress',
    title: 'Ändra e-post',
    body: 'Du har begärt att ändra e-postadressen för ditt Citewalk-konto. Klicka på länken nedan för att bekräfta. Länken går ut om 24 timmar.',
    buttonLabel: 'Bekräfta ny e-post',
    ignore:
      'Om du inte begärde detta kan du ignorera det här e-postmeddelandet.',
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
    subject: 'Your Data Export',
    title: 'Download Ready',
    body: 'Your data archive is ready. Click the button below to download your export (ZIP). This link expires in 7 days.',
    buttonLabel: 'Download Data',
    ignore: 'If you did not request this, you can ignore this email.',
  },
  de: {
    subject: 'Ihr Datenexport',
    title: 'Download Bereit',
    body: 'Ihr Datenarchiv steht bereit. Klicken Sie auf den Button unten, um Ihren Export (ZIP) herunterzuladen. Der Link ist 7 Tage gültig.',
    buttonLabel: 'Daten herunterladen',
    ignore:
      'Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.',
  },
  fr: {
    subject: 'Votre export de données',
    title: 'Téléchargement prêt',
    body: 'Votre archive de données est prête. Cliquez sur le bouton ci-dessous pour télécharger votre export (ZIP). Ce lien expire dans 7 jours.',
    buttonLabel: 'Télécharger les données',
    ignore:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
  },
  es: {
    subject: 'Tu exportación de datos',
    title: 'Descarga lista',
    body: 'Tu archivo de datos está listo. Haz clic en el botón de abajo para descargar tu exportación (ZIP). El enlace caduca en 7 días.',
    buttonLabel: 'Descargar datos',
    ignore: 'Si no has solicitado esto, puedes ignorar este correo.',
  },
  it: {
    subject: 'La tua esportazione dati',
    title: 'Download pronto',
    body: 'Il tuo archivio dati è pronto. Clicca sul pulsante qui sotto per scaricare la tua esportazione (ZIP). Questo link scade in 7 giorni.',
    buttonLabel: 'Scarica dati',
    ignore: 'Se non hai richiesto questo, puoi ignorare questa email.',
  },
  pt: {
    subject: 'Sua exportação de dados',
    title: 'Download pronto',
    body: 'Seu arquivo de dados está pronto. Clique no botão abaixo para baixar sua exportação (ZIP). Este link expira em 7 dias.',
    buttonLabel: 'Baixar dados',
    ignore: 'Se você não solicitou isso, pode ignorar este e-mail.',
  },
  nl: {
    subject: 'Uw gegevensexport',
    title: 'Download gereed',
    body: 'Uw data-archief staat klaar. Klik op de knop hieronder om uw export (ZIP) te downloaden. Deze link verloopt over 7 dagen.',
    buttonLabel: 'Gegevens downloaden',
    ignore: 'Als u dit niet heeft aangevraagd, kunt u deze e-mail negeren.',
  },
  pl: {
    subject: 'Twój eksport danych',
    title: 'Pobieranie gotowe',
    body: 'Twoje archiwum danych jest gotowe. Kliknij przycisk poniżej, aby pobrać eksport (ZIP). Link wygasa za 7 dni.',
    buttonLabel: 'Pobierz dane',
    ignore: 'Jeśli tego nie zażądałeś, możesz zignorować ten e-mail.',
  },
  ru: {
    subject: 'Ваш экспорт данных',
    title: 'Загрузка готова',
    body: 'Ваш архив данных готов. Нажмите кнопку ниже, чтобы загрузить экспорт (ZIP). Ссылка действительна 7 дней.',
    buttonLabel: 'Скачать данные',
    ignore: 'Если вы этого не запрашивали, можете проигнорировать это письмо.',
  },
  cs: {
    subject: 'Váš export dat',
    title: 'Stahování připraveno',
    body: 'Váš datový archiv je připraven. Kliknutím na tlačítko níže stáhnete export (ZIP). Odkaz vyprší za 7 dní.',
    buttonLabel: 'Stáhnout data',
    ignore: 'Pokud jste o to nežádali, můžete tento e-mail ignorovat.',
  },
  da: {
    subject: 'Din dataeksport',
    title: 'Download klar',
    body: 'Dit dataarkiv er klar. Klik på knappen nedenfor for at downloade din eksport (ZIP). Dette link udløber om 7 dage.',
    buttonLabel: 'Hent data',
    ignore: 'Hvis du ikke har anmodet om dette, kan du ignorere denne e-mail.',
  },
  fi: {
    subject: 'Tietojen vientisi',
    title: 'Lataus valmis',
    body: 'Tietoarkistosi on valmis. Napsauta alla olevaa painiketta ladataksesi vientisi (ZIP). Linkki vanhenee 7 päivässä.',
    buttonLabel: 'Lataa tiedot',
    ignore: 'Jos et pyytänyt tätä, voit jättää tämän sähköpostin huomiotta.',
  },
  hu: {
    subject: 'Adat exportod',
    title: 'Letöltés kész',
    body: 'Az adatarchívumod készen áll. Kattints az alábbi gombra az export (ZIP) letöltéséhez. A link 7 napig érvényes.',
    buttonLabel: 'Adatok letöltése',
    ignore: 'Ha nem te kérted, figyelmen kívül hagyhatod ezt az e-mailt.',
  },
  no: {
    subject: 'Din dataeksport',
    title: 'Nedlasting klar',
    body: 'Dataarkivet ditt er klart. Klikk på knappen nedenfor for å laste ned eksporten (ZIP). Denne lenken utløper om 7 dager.',
    buttonLabel: 'Last ned data',
    ignore: 'Hvis du ikke ba om dette, kan du ignorere denne e-posten.',
  },
  sv: {
    subject: 'Din dataexport',
    title: 'Nedladdning redo',
    body: 'Ditt dataarkiv är redo. Klicka på knappen nedan för att ladda ner din export (ZIP). Länken går ut om 7 dagar.',
    buttonLabel: 'Ladda ner data',
    ignore:
      'Om du inte begärde detta kan du ignorera det här e-postmeddelandet.',
  },
};
