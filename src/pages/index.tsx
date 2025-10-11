import React from 'react';
import Layout from '@/components/Layout';
import HeroBanner from '@/components/HeroBanner';
import ServiceTiles from '@/components/ServiceTiles';

const HomePage: React.FC = () => {
  return (
    <Layout>
      <HeroBanner />
      <ServiceTiles />
    </Layout>
  );
};

export default HomePage;