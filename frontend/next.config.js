/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hssc.gov.in" },
      { protocol: "https", hostname: "hpsc.gov.in" },
      { protocol: "https", hostname: "haryanapolicerecruitment.gov.in" },
    ],
  },
};

module.exports = nextConfig;
