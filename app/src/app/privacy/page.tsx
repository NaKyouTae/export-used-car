"use client";

import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      <PageHeader title={t("Privacy Policy")} />

      <article className="px-5 pt-6 pb-10 text-[13px] leading-relaxed text-gray-600 space-y-6">
        <p className="text-[12px] text-gray-400 text-right">
          {t("Effective Date: July 5, 2026")}
        </p>

        <section>
          <p>
            {t(
              'Dubai Trading Co., Ltd. ("Ajucar", "we", "us") operates the Ajucar platform ("Service"), which connects international buyers with sellers of used vehicles exported from the Republic of Korea. This Privacy Policy explains how we collect, use, store, and disclose your personal information when you use the Service. By creating an account or using the Service, you agree to the practices described below.'
            )}
          </p>
        </section>

        <Section title={t("1. Information We Collect")}>
          <ItemBlock label={t("When you create an account")}>
            <li>
              {t("Required: email address, full name, country of residence")}
            </li>
            <li>{t("Optional: company name, phone number")}</li>
            <li>
              {t(
                "Email verification code (one-time, used only for sign-in verification)"
              )}
            </li>
          </ItemBlock>
          <ItemBlock label={t("When you use the Service")}>
            <li>
              {t(
                "Wishlist, viewing history, and chat messages exchanged with sellers"
              )}
            </li>
            <li>
              {t(
                "If you become a seller: company name, contact name, business registration number, address, and business license image"
              )}
            </li>
            <li>{t("Vehicle listings, photos, and documents you upload")}</li>
          </ItemBlock>
          <ItemBlock label={t("Automatically collected")}>
            <li>
              {t("Device information (browser type, operating system, language)")}
            </li>
            <li>{t("IP address, access logs, and approximate location")}</li>
            <li>
              {t(
                "Cookies and similar technologies used for authentication (httpOnly JWT cookies) and session management"
              )}
            </li>
          </ItemBlock>
        </Section>

        <Section title={t("2. How We Use Your Information")}>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              {t("To create and maintain your account and verify your identity")}
            </li>
            <li>
              {t(
                "To enable communication between buyers and sellers regarding vehicle listings"
              )}
            </li>
            <li>{t("To display, recommend, and search vehicle listings")}</li>
            <li>
              {t(
                "To provide customer support and respond to inquiries or disputes"
              )}
            </li>
            <li>
              {t(
                "To prevent fraud, abuse, and violations of our Terms of Service"
              )}
            </li>
            <li>
              {t(
                "To comply with applicable laws and respond to lawful requests from authorities"
              )}
            </li>
          </ul>
        </Section>

        <Section title={t("3. Legal Basis for Processing")}>
          <p>
            {t(
              "We process your personal information based on (a) your consent given at sign-up, (b) the performance of the contract under our Terms of Service, (c) our legitimate interests in operating and improving the Service, and (d) compliance with legal obligations. You may withdraw consent at any time as described in Section 7."
            )}
          </p>
        </Section>

        <Section title={t("4. Sharing and Disclosure")}>
          <p>
            {t(
              "We do not sell your personal information. We share information only in the following cases:"
            )}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>
              <strong>{t("Between buyers and sellers:")}</strong>{" "}
              {t(
                "When you initiate a chat or inquiry, your name, country, and company are visible to the other party."
              )}
            </li>
            <li>
              <strong>{t("Service providers:")}</strong>{" "}
              {t(
                "Cloud hosting and storage (Supabase, Singapore region), email delivery (SMTP provider), and analytics tools that process data on our behalf under written agreements."
              )}
            </li>
            <li>
              <strong>{t("Legal compliance:")}</strong>{" "}
              {t(
                "When required by law, court order, or to protect the rights, safety, or property of Ajucar or others."
              )}
            </li>
            <li>
              <strong>{t("Business transfer:")}</strong>{" "}
              {t(
                "If we are involved in a merger, acquisition, or sale of assets, your information may be transferred under equivalent protection."
              )}
            </li>
          </ul>
        </Section>

        <Section title={t("5. International Data Transfer")}>
          <p>
            {t(
              "Ajucar is operated from the Republic of Korea, and your personal information is stored and processed on cloud servers located in Singapore, provided by our processor Supabase. It may also be accessed by our team in Korea to operate the Service. These countries may have data protection laws that differ from those of your country."
            )}
          </p>
          <p className="mt-3 font-medium text-gray-800">
            {t("Details of the overseas transfer:")}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-1">
            <li>
              <strong>{t("Recipient:")}</strong>{" "}
              {t("Supabase, Inc. (cloud infrastructure and storage provider)")}
            </li>
            <li>
              <strong>{t("Country of transfer:")}</strong>{" "}
              {t("Singapore (data center); Republic of Korea (operational access)")}
            </li>
            <li>
              <strong>{t("Items transferred:")}</strong>{" "}
              {t(
                "The account, profile, listing, chat, and usage data described in Section 1."
              )}
            </li>
            <li>
              <strong>{t("Purpose:")}</strong>{" "}
              {t("Cloud hosting, storage, and operation of the Service.")}
            </li>
            <li>
              <strong>{t("Retention:")}</strong>{" "}
              {t("For the periods described in Section 6 (Data Retention).")}
            </li>
            <li>
              <strong>{t("Right to refuse:")}</strong>{" "}
              {t(
                "You may refuse this transfer by not creating an account or by deleting your account; however, the Service cannot be provided without it."
              )}
            </li>
          </ul>
          <p className="mt-3">
            {t(
              "By creating an account and using the Service, you acknowledge and consent to this overseas transfer of your personal information."
            )}
          </p>
        </Section>

        <Section title={t("6. Data Retention")}>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              {t(
                "Account information: retained while your account is active and deleted within 30 days after account deletion, unless a longer retention period is required by law."
              )}
            </li>
            <li>
              {t(
                "Chat messages: retained for up to 3 years for dispute resolution and fraud prevention."
              )}
            </li>
            <li>
              {t(
                "Email verification codes: deleted within 5 minutes of issuance or upon use."
              )}
            </li>
            <li>
              {t(
                "Access logs and IP addresses: retained for up to 3 months (Korean Communications Privacy Act)."
              )}
            </li>
          </ul>
        </Section>

        <Section title={t("7. Your Rights")}>
          <p>{t("You have the right to:")}</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>{t("Access and obtain a copy of your personal information")}</li>
            <li>{t("Correct inaccurate or incomplete information")}</li>
            <li>
              {t("Delete your account and associated personal information")}
            </li>
            <li>{t("Withdraw your consent at any time")}</li>
            <li>{t("Object to or restrict certain processing activities")}</li>
          </ul>
          <p className="mt-2">
            {t(
              "To exercise these rights, contact us at the address below. We will respond within 30 days."
            )}
          </p>
          <p className="mt-2">
            {t(
              "Depending on where you live, local law may grant you additional rights (for example, the EU/UK GDPR, Brazil's LGPD, Saudi Arabia's PDPL, and similar laws in Southeast Asia and Africa), such as data portability and the right to lodge a complaint with your local data protection authority. We apply these protections to all users regardless of location."
            )}
          </p>
        </Section>

        <Section title={t("8. Security")}>
          <p>
            {t(
              "We implement technical and organizational measures to protect your personal information, including encrypted connections (HTTPS), httpOnly cookies for authentication tokens, access controls, and regular security reviews. No system is 100% secure; you are responsible for keeping your account credentials confidential."
            )}
          </p>
        </Section>

        <Section title={t("9. Children's Privacy")}>
          <p>
            {t(
              "The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected such information, we will delete it promptly."
            )}
          </p>
        </Section>

        <Section title={t("10. Changes to This Policy")}>
          <p>
            {t(
              "We may update this Privacy Policy from time to time. Material changes will be notified through the Service or by email at least 7 days before they take effect. Continued use of the Service after the effective date constitutes acceptance of the updated policy."
            )}
          </p>
        </Section>

        <Section title={t("11. Contact")}>
          <p>
            {t(
              "For privacy-related inquiries, requests to exercise your rights, or complaints, please contact:"
            )}
          </p>
          <div className="mt-3 rounded-xl bg-gray-50 p-4 text-[12px] leading-relaxed text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-800">
              Dubai Trading Co., Ltd.
            </p>
            <p>{t("CEO: Hae-gi Choi")}</p>
            <p>{t("Business Registration No.: 897-88-01852")}</p>
            <p>
              {t(
                "Address: #1127, Bldg. 1, 16 Jinjangyutong-ro, Buk-gu, Ulsan, Republic of Korea"
              )}
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
