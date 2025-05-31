import React, { useState } from 'react';
import { Clock, ArrowUpRight, ArrowLeft, ArrowRight } from 'lucide-react';

import CategoryCard from '../components/cards/CategoryCard';
import LoyaltyCard from '../components/cards/LoyaltyCard';
import FeatureCard from '../components/cards/FeatureCard';
import StepIndicator from '../components/ui/StepIndicator';
import FAQ from '../components/ui/FAQ';
import BagBroken from '../assets/icons/BagBroken';
import EarthBroken from '../assets/icons/EarthBroken';
import KeyBroken from '../assets/icons/KeyBroken';

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState(0);

  // Data configurations
  const categories = [
    { name: 'Shopping', iconName: 'Shopping', color: 'bg-indigo-950' },
    { name: 'Healthcare', iconName: 'Healthcare', color: 'bg-blue-700' },
    { name: 'Travel', iconName: 'Travel', color: 'bg-indigo-800' },
    { name: 'Dining', iconName: 'Dining', color: 'bg-blue-700' },
  ];

  const nextCategory = () => {
    setActiveCategory((prev) => {
      const newIndex = (prev + 1) % categories.length;
      return newIndex;
    });
  };

  const prevCategory = () => {
    setActiveCategory((prev) => {
      const newIndex = (prev - 1 + categories.length) % categories.length;
      return newIndex;
    });
  };

  const handleCategoryClick = (index) => {
    setActiveCategory(index);
  };

  const howItWorksSteps = [
    {
      step: 1,
      title: 'Apply for Your Pravasi Previlage Card',
      description:
        'Fill out a simple form with your name, email, and your preferred discount category (e.g., Restaurants, Fashion, Groceries). Click "Apply Now" to submit your request for a loyalty card.',
    },
    {
      step: 2,
      title: 'Email Verification with OTP',
      description:
        "Once you apply, you'll receive an email with a One-Time Password (OTP). Enter this OTP on the website to verify your identity and confirm your interest in the selected discount offer.",
    },
    {
      step: 3,
      title: 'Activate and Use Your Discount Card',
      description:
        'After OTP verification, your loyalty card will be issued with a countdown timer. Click "Activate Now" before the timer expires.',
    },
  ];

  const features = [
    {
      icon: BagBroken,
      title: 'Discounts in All the Right Places',
      description:
        "Whether you're visiting family, dining out, shopping for gifts, or looking for personal care services — our cards unlock special rates at top-rated restaurants, retail outlets, beauty salons, wellness centers, grocery stores, and much more.",
    },
    {
      icon: Clock,
      title: 'Time-Limited Offers That Add Real Value',
      description:
        "We believe in giving you the best when it matters the most. Every card comes with exclusive discounts that are valid for a limited time creating urgency but also ensuring freshness and genuine value. Activate when you're ready and use it before it expires.",
    },
    {
      icon: EarthBroken,
      title: 'Personalized Offers Based on Your Location & Needs',
      description:
        "Once you select a category (like food, shopping, or wellness), our platform shows you the most relevant offers near you. This way, you only see discounts that you'll actually use tailored for where you are and what you love.",
    },
    {
      icon: KeyBroken,
      title: 'Verified Cards & Secure Access Process',
      description:
        "We believe in giving you the best when it matters the most. Every card comes with exclusive discounts that are valid for a limited time creating urgency but also ensuring freshness and genuine value. Activate when you're ready and use it before it expires.",
    },
  ];

  const faqData = [
    {
      question: 'What is a Pravasi Previlage Discount Card?',
      answer:
        'The Pravasi Previlage Card is a digital loyalty card that provides exclusive discounts and offers at partner stores across various categories including shopping, dining, healthcare, and travel.',
    },
    {
      question: 'How do I get a discount card?',
      answer:
        'Simply fill out our application form with your details and preferred category, verify your email with the OTP we send, and your digital card will be issued immediately.',
    },
    {
      question: 'Why do I need to enter an OTP?',
      answer:
        'OTP verification ensures the security of your account and confirms that you have access to the email address provided during registration.',
    },
    {
      question: 'How long is the card valid after activation?',
      answer:
        'Cards are typically valid for 12 months from the date of activation. You can check the exact expiry date in your digital card.',
    },
    {
      question: 'Can I reuse the same card?',
      answer:
        'Yes, once activated, you can use your card multiple times at any of our partner locations until it expires.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="px-6 ml-4 py-8">
        <section className="bg-[#7AC3FB] py-24 px-6 relative overflow-hidden rounded-3xl">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-cyan-400/20"></div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1
              className="font-figtree text-4xl md:text-6xl font-bold mb-12 leading-tight text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  'linear-gradient(271.57deg, #52B4FF -27.72%, #0066B5 99.65%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Unlock Amazing Discounts with
              <br />
              Our Pravasi Previlage Card.
            </h1>

            {/* Loyalty Card Display */}
            <div className="mb-16 flex justify-center">
              <LoyaltyCard />
            </div>

            {/* CTA Section - matching the UI layout */}
            <div className="mx-4 md:mx-8 lg:mx-12 font-figtree">
              <div className="flex flex-col md:flex-row items-center justify-between mt-16">
                {/* Left text */}
                <div className="text-left mb-6 md:mb-0 flex-1">
                  <p className="text-xl text-[#222158] font-semibold">
                    Enjoy exclusive savings at your
                    <br />
                    favorite stores. Shop smart, save
                    <br />
                    big!
                  </p>
                </div>

                {/* Center button */}
                <div className="flex-shrink-0 mx-8">
                  <button className="bg-sky-300 hover:bg-sky-200 font-semibold px-10 py-4 rounded-full shadow-lg flex items-center space-x-2 transition-colors duration-200">
                    <span className="text-[#222158] font-semibold text-xl">
                      APPLY NOW
                    </span>
                    <ArrowUpRight
                      size={20}
                      className="text-[#222158] font-semibold text-xl"
                    />
                  </button>
                </div>

                {/* Right text */}
                <div className="text-right flex-1">
                  <div className="text-[#222158] font-semibold text-xl">
                    Activate & Save Instantly!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Categories Section */}
      <section className="py-16 px-6 ml-4 font-figtree">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Explore Partnered Categories & Brands
              </h2>
              <p className="text-[#707070] text-xl">
                Discover stores by category and use your Pravasi Privilege Card
                to unlock exclusive in-store benefits.
              </p>
            </div>

            {/* Navigation buttons with better styling */}
            <div className="flex space-x-2">
              <button
                onClick={prevCategory}
                className="p-3 rounded-full border-2 border-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200 z-10"
                aria-label="Previous category"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={nextCategory}
                className="p-3 rounded-full border-2 border-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200 z-10"
                aria-label="Next category"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.name}
                category={category}
                isActive={activeCategory === index}
                onClick={() => handleCategoryClick(index)}
              />
            ))}
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 px-6 ml-4  font-figtree">
        <div className="max-w-7xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold mb-16 text-transparent bg-clip-text"
            style={{
              backgroundImage:
                'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            How It Works
          </h2>

          <StepIndicator
            steps={howItWorksSteps}
            currentStep={3}
            orientation="horizontal"
          />
        </div>
      </section>
      {/* Why Choose Section */}
      <div className="px-6 ml-4 mt-12 py-8">
        <section
          className="py-16 px-6 text-white relative rounded-3xl font-figtree"
          style={{
            background:
              'linear-gradient(181.2deg, #222158 1.03%, #0066B5 248.15%)',
          }}
        >
          {/* Decorative card elements */}
          <div className="absolute -top-38 -right-20 transform -rotate-28 z-50 scale-50">
            <LoyaltyCard
              className="rounded-xl [box-shadow:-4px_-4px_10px_rgba(0,0,0,0.1),4px_-4px_10px_rgba(0,0,0,0.1)]"
              showAnimation={false}
            />
          </div>
          <div className="absolute -bottom-48 -left-26 transform rotate-32 scale-50">
            <LoyaltyCard
              className="w-72 rounded-xl [box-shadow:-4px_4px_10px_rgba(0,0,0,0.1),4px_4px_10px_rgba(0,0,0,0.1)]"
              showAnimation={false}
            />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <h2
              className="text-3xl md:text-4xl font-bold mb-16 text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Why Choose Pravasi Privilege Card?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  variant="default"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
      {/* FAQ Section */}
      <div className="px-6 ml-4 mt-24 py-8">
        <section className="py-16 px-6 bg-white font-figtree">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left side - FAQ Title */}
              <div className="max-w-sm">
                <h2
                  className="text-4xl md:text-5xl font-bold text-blue-400 mb-6"
                  style={{
                    backgroundImage:
                      'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  FAGs
                </h2>
                <p className="text-[#707070] text-lg leading-relaxed">
                  Here's what most users want to know before getting started.
                </p>
              </div>
              {/* Right side - FAQ Items */}
              <div className="w-full">
                <FAQ questions={faqData} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
