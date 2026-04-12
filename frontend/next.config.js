/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from govt sites
  images: {
    domains: ["hssc.gov.in", "hpsc.gov.in", "haryanapolicerecruitment.gov.in"],
  },
};

module.exports = nextConfig;
