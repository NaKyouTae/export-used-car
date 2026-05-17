import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Privacy Policy | Ajucar",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Privacy Policy" />

      <article className="px-5 pt-6 pb-10 text-[13px] leading-relaxed text-gray-600 space-y-6">
        <p className="text-[12px] text-gray-400 text-right">
          Effective Date: May 17, 2026
        </p>

        <section>
          <p>
            Dubai Trading Co., Ltd. (&quot;<strong>Ajucar</strong>&quot;,
            &quot;we&quot;, &quot;us&quot;) operates the Ajucar platform
            (&quot;<strong>Service</strong>&quot;), which connects international
            buyers with sellers of used vehicles exported from the Republic of
            Korea. This Privacy Policy explains how we collect, use, store, and
            disclose your personal information when you use the Service. By
            creating an account or using the Service, you agree to the
            practices described below.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <ItemBlock label="When you create an account">
            <li>Required: email address, full name, country of residence</li>
            <li>Optional: company name, phone number</li>
            <li>
              Email verification code (one-time, used only for sign-in
              verification)
            </li>
          </ItemBlock>
          <ItemBlock label="When you use the Service">
            <li>
              Wishlist, viewing history, and chat messages exchanged with
              sellers
            </li>
            <li>
              If you become a seller: company name, contact name, business
              registration number, address, and business license image
            </li>
            <li>Vehicle listings, photos, and documents you upload</li>
          </ItemBlock>
          <ItemBlock label="Automatically collected">
            <li>
              Device information (browser type, operating system, language)
            </li>
            <li>IP address, access logs, and approximate location</li>
            <li>
              Cookies and similar technologies used for authentication
              (httpOnly JWT cookies) and session management
            </li>
          </ItemBlock>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To create and maintain your account and verify your identity</li>
            <li>
              To enable communication between buyers and sellers regarding
              vehicle listings
            </li>
            <li>To display, recommend, and search vehicle listings</li>
            <li>
              To provide customer support and respond to inquiries or disputes
            </li>
            <li>
              To prevent fraud, abuse, and violations of our Terms of Service
            </li>
            <li>
              To comply with applicable laws and respond to lawful requests
              from authorities
            </li>
          </ul>
        </Section>

        <Section title="3. Legal Basis for Processing">
          <p>
            We process your personal information based on (a) your consent
            given at sign-up, (b) the performance of the contract under our
            Terms of Service, (c) our legitimate interests in operating and
            improving the Service, and (d) compliance with legal obligations.
            You may withdraw consent at any time as described in Section 7.
          </p>
        </Section>

        <Section title="4. Sharing and Disclosure">
          <p>
            We do not sell your personal information. We share information only
            in the following cases:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>
              <strong>Between buyers and sellers:</strong> When you initiate a
              chat or inquiry, your name, country, and company are visible to
              the other party.
            </li>
            <li>
              <strong>Service providers:</strong> Cloud hosting (Supabase),
              email delivery (Nodemailer / SMTP provider), and analytics tools
              that process data on our behalf under written agreements.
            </li>
            <li>
              <strong>Legal compliance:</strong> When required by law, court
              order, or to protect the rights, safety, or property of Ajucar
              or others.
            </li>
            <li>
              <strong>Business transfer:</strong> If we are involved in a
              merger, acquisition, or sale of assets, your information may be
              transferred under equivalent protection.
            </li>
          </ul>
        </Section>

        <Section title="5. International Data Transfer">
          <p>
            The Service is operated from the Republic of Korea. If you access
            the Service from outside Korea, your information will be
            transferred to, stored, and processed in Korea. Korea has data
            protection laws that may differ from those of your country. By
            using the Service, you consent to this transfer.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Account information: retained while your account is active and
              deleted within 30 days after account deletion, unless a longer
              retention period is required by law.
            </li>
            <li>
              Chat messages: retained for up to 3 years for dispute resolution
              and fraud prevention.
            </li>
            <li>
              Email verification codes: deleted within 5 minutes of issuance
              or upon use.
            </li>
            <li>
              Access logs and IP addresses: retained for up to 3 months
              (Korean Communications Privacy Act).
            </li>
          </ul>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Access and obtain a copy of your personal information</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Delete your account and associated personal information</li>
            <li>Withdraw your consent at any time</li>
            <li>Object to or restrict certain processing activities</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at the address below. We will
            respond within 30 days.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We implement technical and organizational measures to protect your
            personal information, including encrypted connections (HTTPS),
            httpOnly cookies for authentication tokens, access controls, and
            regular security reviews. No system is 100% secure; you are
            responsible for keeping your account credentials confidential.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            The Service is not directed to individuals under the age of 18.
            We do not knowingly collect personal information from children.
            If we learn that we have collected such information, we will
            delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Material
            changes will be notified through the Service or by email at least
            7 days before they take effect. Continued use of the Service after
            the effective date constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For privacy-related inquiries, requests to exercise your rights,
            or complaints, please contact:
          </p>
          <div className="mt-3 rounded-xl bg-gray-50 p-4 text-[12px] leading-relaxed text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-800">
              Dubai Trading Co., Ltd.
            </p>
            <p>CEO: Hae-gi Choi</p>
            <p>Business Registration No.: 897-88-01852</p>
            <p>
              Address: #1127, Bldg. 1, 16 Jinjangyutong-ro, Buk-gu, Ulsan,
              Republic of Korea
            </p>
            <p>Email: ajucar0510@naver.com</p>
          </div>
        </Section>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[14px] font-semibold text-gray-900 mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function ItemBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="font-medium text-gray-800 mb-1">{label}</p>
      <ul className="list-disc pl-5 space-y-1">{children}</ul>
    </div>
  );
}
