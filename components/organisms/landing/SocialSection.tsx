"use client";

import React from "react";
import { SocialCard } from "@/components/molecules/SocialCard";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { AiFillInstagram, AiFillYoutube, AiOutlineWhatsApp } from "react-icons/ai";
import { FaTiktok } from "react-icons/Fa";

export function SocialSection() {
  const socials = [
    {
      platform: "Instagram",
      url: "https://instagram.com/karangtarunamojosongo",
      followers: "2.5K+",
      colorClass: "bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#C13584]",
      icon: <AiFillInstagram size={40} />,
    },
    {
      platform: "YouTube",
      url: "https://youtube.com",
      followers: "1K+",
      colorClass: "bg-[#FF0000]",
      icon: <AiFillYoutube size={40} />,
    },
    {
      platform: "TikTok",
      url: "https://tiktok.com",
      followers: "5K+",
      colorClass: "bg-gradient-to-tr from-[#000000] to-[#25F4EE]",
      icon: <FaTiktok size={36} />,
    },
    {
      platform: "WhatsApp",
      url: "https://wa.me/6281",
      followers: "Community",
      colorClass: "bg-[#25D366]",
      icon: <AiOutlineWhatsApp size={40} />,
    },
  ];

  return (
    <section id="social" className="w-full py-24 md:py-32 bg-n-100 dark:bg-n-800 relative z-20">
      <div className="container mx-auto px-6">
        
        <div className="flex flex-col items-center text-center mb-16">
          <AnimatedText as="h2" text="IKUTI KAMI" className="text-4xl md:text-6xl font-title font-bold text-foreground" />
          <h2 className="text-4xl md:text-6xl font-title font-bold text-transparent mt-[-10px]" style={{ WebkitTextStroke: '1px var(--color-foreground)' }}>
            DI SOSIAL MEDIA
          </h2>
          <p className="mt-6 text-muted-foreground font-body max-w-xl">
            Ikuti perjalanan kami, dapatkan update terbaru, dan saksikan keseruan aksi pemuda Mojosongo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {socials.map((social, idx) => (
            <SocialCard
              key={idx}
              index={idx}
              platform={social.platform}
              url={social.url}
              followers={social.followers}
              colorClass={social.colorClass}
              icon={social.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
