/**
 * Manual alias map: courses.json `universita` string → MUR `name` string.
 * Used as last-resort fallback in resolveUniversity() after exact and
 * normalised matching both fail. Keys are matched case-insensitively.
 */
export const UNI_ALIAS_MAP: Record<string, string> = {
  'Alma Mater Studiorum - Università di BOLOGNA':
    'Università degli studi di Bologna',
  'LINK CAMPUS University':
    'Link Campus University di Roma',
  'LUM "Giuseppe Degennaro"':
    'Libera Università Mediterranea "Giuseppe Degennaro"',
  'Libera Università degli Studi "Maria SS.Assunta" - LUMSA':
    'Libera Università Maria SS.Assunta - (LUMSA) di Roma',
  'Libera Università di lingue e comunicazione IULM-MI':
    'Libera Università di Lingue e Comunicazione (IULM)',
  'Luiss Libera Università Internazionale degli Studi Sociali Guido Carli':
    'Luiss - Libera Università internazionale degli studi sociali Guido Carli di Roma',
  'UKE - Università Kore di ENNA':
    'Libera Università della Sicilia Centrale "KORE" di Enna',
  'UNICUSANO Università degli Studi Niccolò Cusano -Telematica Roma':
    'Università telematica Niccolò Cusano di Roma',
  'UNISR - Università Vita Salute San Raffaele':
    'Libera Università, Vita-Salute San Raffaele di Milano',
  'UniCamillus - Saint Camillus International University of Health Sciences':
    'Saint Camillus International University of Health',
  'Università Politecnica delle MARCHE':
    'Università Politecnica delle Marche - Ancona',
  'Università Telematica "E-CAMPUS"':
    'Università telematica "e-Campus" di Novedrate (CO)',
  'Università Telematica "GIUSTINO FORTUNATO"':
    'Università telematica "Giustino Fortunato" di Benevento',
  'Università Telematica "LEONARDO da VINCI"':
    'Università telematica non statale "Leonardo da Vinci" di Torrevecchia Teatina (CH)',
  'Università Telematica "Universitas MERCATORUM"':
    'Universitas telematica Mercatorum di Roma',
  'Università Telematica Internazionale UNINETTUNO':
    'Università telematica internazionale UNINETTUNO di Roma',
  'Università Telematica PEGASO':
    'Università telematica "Pegaso" di Napoli',
  'Università Telematica San Raffaele Roma':
    'Università telematica "San Raffaele" di Roma - già "UNITEL"',
  "Università degli Studi \"G. d'Annunzio\" CHIETI-PESCARA":
    "Università degli studi Gabriele D'Annunzio di Chieti e Pescara",
  'Università degli Studi "Guglielmo Marconi" - Telematica':
    'Università telematica Guglielmo Marconi di Roma',
  'Università degli Studi "Magna Graecia" di CATANZARO':
    'Università degli studi di Catanzaro - Magna Grecia',
  'Università degli Studi INSUBRIA Varese-Como':
    "Università degli studi dell' Insubria",
  'Università degli Studi del PIEMONTE ORIENTALE':
    'Università degli studi del Piemonte orientale "Amedeo Avogadro"',
  'Università degli Studi del SANNIO di BENEVENTO':
    'Università degli Studi del Sannio',
  "Università degli Studi dell'AQUILA":
    "Università degli studi di L'Aquila",
  'Università degli Studi di BARI ALDO MORO':
    'Università degli studi di Bari',
  "Università degli Studi di NAPOLI \"L'Orientale\"":
    "Università degli studi L'Orientale di Napoli",
  'Università degli Studi di Roma UnitelmaSapienza':
    'Università telematica Unitelma Sapienza di Roma',
  'Università degli Studi di Urbino Carlo Bo':
    'Università degli studi "Carlo Bo" di Urbino',
  'Università degli Studi di SCIENZE GASTRONOMICHE':
    'Università di Scienze Gastronomiche',
  'Università degli Studi EUROPEA di ROMA':
    'Università Europea di Roma',
  'Università Telematica degli Studi IUL':
    'Università telematica "Italian University line" di Firenze',
};
