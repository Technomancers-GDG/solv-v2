import React, { useEffect } from "react";
import NavigationBar from "../components/homepage/NavigationBar";
import HeroSection from "../components/homepage/HeroSection";
import OperationalMetricsBar from "../components/homepage/OperationalMetricsBar";
import ProductVisualization from "../components/homepage/ProductVisualization";
import CoreFeaturesSection from "../components/homepage/CoreFeaturesSection";
import HowItWorksSection from "../components/homepage/HowItWorksSection";
import TrustReliabilitySection from "../components/homepage/TrustReliabilitySection";
import FinalCTASection from "../components/homepage/FinalCTASection";
import Footer from "../components/homepage/Footer";

// Import homepage-specific CSS stylesheet
import "../styles/homepage.css";

export default function HomePage() {
  // Update document metadata for enterprise branding and SEO compliance
  useEffect(() => {
    document.title = "LogiSight — Intelligent Logistics Optimization";
    
    // Add meta description if not present
    let metaDescription = document.querySelector("meta[name='description']");
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Unifying route optimization, real-time tracking, predictive risk analysis, and automated supply chain decision-making.";

    // Smooth scroll settings for landing sections
    document.documentElement.style.scrollBehavior = "smooth";

    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="homepage-root">
      {/* Sticky header navigation */}
      <NavigationBar />
      
      <main>
        {/* Hero title, CTAs, and India Supply Chain SVG map */}
        <HeroSection />
        
        {/* Animated key operational statistics bar */}
        <OperationalMetricsBar />
        
        {/* Interactive capabilities browser mockups slider */}
        <ProductVisualization />
        
        {/* Technical feature information grids */}
        <CoreFeaturesSection />
        
        {/* Operational pipeline sequence flow steps */}
        <HowItWorksSection />
        
        {/* Deco platform stack architecture and assurance metrics */}
        <TrustReliabilitySection />
        
        {/* Action capture footer buttons */}
        <FinalCTASection />
      </main>

      {/* Corporate copyright and legal tags footer */}
      <Footer />
    </div>
  );
}
