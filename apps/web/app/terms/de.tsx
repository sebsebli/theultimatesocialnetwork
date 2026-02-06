import Link from "next/link";

/** German translation of the Terms of Service. */
export function TermsContentDE() {
  return (
    <>
      {/* 1 */}
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          1. Geltungsbereich, Vereinbarung & Berechtigung
        </h2>
        <p>
          Diese Nutzungsbedingungen ({"\u201EAGB\u201C"}) regeln die Nutzung der
          Plattform und Dienste, betrieben von{" "}
          <strong>Dr. Sebastian Lindner</strong> ({"\u201EBetreiber\u201C"},{" "}
          {"\u201Ewir\u201C"}), erreichbar über die Domain{" "}
          <strong>citewalk.com</strong> und die zugehörigen mobilen Anwendungen
          ({"\u201EDienst\u201C"}).
        </p>
        <p>
          Durch die Nutzung des Dienstes schließen Sie einen rechtsverbindlichen
          Vertrag gemäß §§ 145 ff. BGB. Sie bestätigen, dass Sie mindestens 16
          Jahre alt sind.
        </p>
      </section>

      {/* 2 */}
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          2. Änderung der AGB
        </h2>
        <p>
          Wir können diese AGB jederzeit aus berechtigten Gründen anpassen.
          Aktualisierte AGB treten mit Veröffentlichung in Kraft. Die
          fortgesetzte Nutzung gilt als Zustimmung.
        </p>
      </section>

      {/* 3 */}
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          3. Nutzerinhalte & Rechtliche Verantwortung
        </h2>

        <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
          3.1 Alleinige Verantwortung für Inhalte
        </h3>
        <p>
          Nutzer sind ausschließlich für alle von ihnen hochgeladenen,
          veröffentlichten oder übermittelten Inhalte verantwortlich. Der
          Betreiber handelt ausschließlich als Hosting-Anbieter im Sinne von
          Art. 6 Digital Services Act (DSA).
        </p>

        <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
          3.2 Verbotene Inhalte
        </h3>
        <p>
          Nutzer dürfen keine rechtswidrigen Inhalte veröffentlichen,
          einschließlich: Volksverhetzung (§130 StGB), Beleidigung,
          Urheberrechtsverletzungen oder terroristische Inhalte. Es gelten
          unsere{" "}
          <Link
            href="/community-guidelines"
            className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
          >
            Community-Richtlinien
          </Link>
          .
        </p>

        <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
          3.3 Verbotenes Verhalten & Permanente Sperre
        </h3>
        <p>
          Verboten: Belästigung, Drohungen, Doxxing, Stalking, Einschüchterung,
          koordinierter Missbrauch, übermäßige Werbung, Spam. Verstöße können
          zur Entfernung von Inhalten, vorübergehender Sperrung oder einer{" "}
          <strong>permanenten Sperre</strong> führen.
        </p>

        <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
          3.4 Widerspruchsrecht bei Moderation (DSA Art. 20)
        </h3>
        <p>
          Bei Entfernung von Inhalten erhalten Sie eine Benachrichtigung mit
          Begründung. Sie können innerhalb von 30 Tagen Widerspruch einlegen.
          Weitere Informationen finden Sie in unseren{" "}
          <Link
            href="/community-guidelines"
            className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
          >
            Community-Richtlinien (Abschnitt 9)
          </Link>
          .
        </p>

        <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
          3.5 Freistellung
        </h3>
        <p>
          Nutzer stellen den Betreiber von allen Ansprüchen Dritter frei, die
          aus ihren Inhalten oder einem Verstoß gegen diese AGB entstehen.
        </p>
      </section>

      {/* 4 */}
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          4. Nachrichten, Sitzungen & Datensicherheit
        </h2>
        <p>
          Der Dienst bietet keine Ende-zu-Ende-Verschlüsselung. Nachrichten
          können in unverschlüsselter oder transportverschlüsselter Form
          gespeichert werden.
        </p>
      </section>

      {/* 5 */}
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          5. Verfügbarkeit, Kündigung & Einstellung
        </h2>
        <p>
          Der Dienst wird nach technischer, wirtschaftlicher und
          organisatorischer Machbarkeit betrieben. Es besteht kein Anspruch auf
          ununterbrochene oder dauerhafte Verfügbarkeit.
        </p>
      </section>

      {/* 6 */}
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          6. Anwendbares Recht & Gerichtsstand
        </h2>
        <p>Es gilt deutsches Recht. UN-Kaufrecht (CISG) ist ausgeschlossen.</p>
        <p>
          Ausschließlicher Gerichtsstand ist Berlin, Deutschland, soweit
          gesetzlich zulässig.
        </p>
      </section>

      {/* 7 */}
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          7. Salvatorische Klausel
        </h2>
        <p>
          Unwirksame Bestimmungen werden durch rechtlich zulässige Regelungen
          ersetzt, die dem wirtschaftlichen Zweck am nächsten kommen.
        </p>
      </section>
    </>
  );
}
