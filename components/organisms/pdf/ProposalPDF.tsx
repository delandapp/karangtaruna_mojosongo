import React from 'react';
import { Page, Text, View, Document, StyleSheet, PDFViewer } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666666',
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  tierBox: {
    marginTop: 20,
    padding: 15,
    border: '2pt solid #0f172a',
    borderRadius: 5,
  },
});

// Create Document Component
export const ProposalDocument = ({ tier, benefits }: { tier: string, benefits: string[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>PROPOSAL SPONSORSHIP</Text>
        <Text style={styles.subtitle}>Karang Taruna Mojosongo 2026</Text>
        
        <Text style={styles.content}>
          Dengan hormat, {"\n\n"}
          Melalui proposal ini, kami mengundang perusahaan Bapak/Ibu untuk berpartisipasi 
          menjadi mitra strategis kegiatan kepemudaan kami. Kerja sama ini diharapkan 
          dapat memberikan dampak positif bagi pengembangan potensi generasi muda sekaligus
          menjadi ajang promosi yang efektif bagi perusahaan Anda.
        </Text>
        
        <View style={styles.tierBox}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Paket Penawaran: {tier.toUpperCase()} TIER
          </Text>
          <Text style={{ fontSize: 12, marginBottom: 5 }}>Benefit Eksklusif:</Text>
          {benefits.map((benefit, index) => (
            <Text key={index} style={{ fontSize: 11, marginLeft: 10, marginBottom: 3 }}>
              • {benefit}
            </Text>
          ))}
        </View>
        
        <Text style={{ fontSize: 10, marginTop: 40, color: '#666666' }}>
          * Dokumen ini digenerate secara otomatis oleh Sistem Karang Taruna.
        </Text>
      </View>
    </Page>
  </Document>
);
