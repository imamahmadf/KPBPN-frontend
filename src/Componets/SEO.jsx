import { useEffect } from "react";
import { Helmet } from "react-helmet";

const SEO = ({ title, description, url, image, organization }) => {
  useEffect(() => {
    // Structured data untuk organization
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "GovernmentOrganization",
      name: organization.name,
      url: organization.url,
      logo: organization.logo,
      description: organization.description,
      address: {
        "@type": "PostalAddress",
        streetAddress: organization.address.streetAddress,
        addressLocality: organization.address.addressLocality,
        addressRegion: organization.address.addressRegion,
        postalCode: organization.address.postalCode,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: organization.contactPoint.telephone,
        contactType: organization.contactPoint.contactType,
      },
    };

    // Tambahkan script ke document
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [organization]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
