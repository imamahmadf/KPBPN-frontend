import React, { useState } from "react";
import Layout from "../Componets/Layout";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  Badge,
  Link,
  Flex,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Button,
  Select,
} from "@chakra-ui/react";
import {
  FaEnvelope,
  FaPhone,
  FaLinkedin,
  FaGraduationCap,
  FaBriefcase,
  FaCode,
  FaUsers,
  FaGlobe,
  FaLanguage,
  FaUtensils,
} from "react-icons/fa";

function DeveloperProfile() {
  const [language, setLanguage] = useState("id"); // 'id' untuk Indonesia, 'en' untuk Inggris, 'ru' untuk Rusia
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const primaryColor = "primary";

  // Translations
  const translations = {
    id: {
      currentPosition: "Posisi Saat Ini",
      education: "Pendidikan",
      workExperience: "Pengalaman Kerja",
      skills: "Keahlian",
      favoriteFood: "Makanan dan Minuman Favorit",
      projects: "Proyek",
      organizations: "Pengalaman Organisasi",
      interpreterExperience: "Pengalaman Interpreter",
      designMultimedia: "Design & Multimedia",
      development: "Development",
      tools: "Tools",
      viewProject: "Lihat Proyek →",
      footerNote: '"Selesaikan Apa yang Sudah Kamu Mulai! - Developer "',
      linkedinProfile: "Profil LinkedIn",
      currentWork: [
        "Mendukung tenaga ahli dalam percepatan investasi sektor energi",
        "Mendukung peningkatan produksi migas",
        "Melakukan analisis dan koordinasi terkait kebijakan investasi energi",
      ],
      educationData: [
        {
          degree: "Full Stack Web Developer",
          institution: "Purwadhika Digital Technology School",
          period: "Agustus 2022 – Februari 2023",
          description:
            "Pelatihan JavaScript intensif untuk menjadi full-stack web developer dalam 12 minggu. Mempelajari berbagai teknologi untuk membangun website yang memenuhi kebutuhan industri. Berkolaborasi untuk membangun proyek nyata menggunakan metodologi agile.",
        },
        {
          degree: "Master Teknik Perkeretaapian",
          institution: "Rostov State Transport University Russia",
          period: "2015–2021",
          gpa: "3.79",
          specialization: "Spesialis manajemen stasiun kereta api penumpang",
          thesis:
            "Varian peningkatan transportasi penumpang multimodal kecepatan tinggi pada arah Jakarta-Bandung (tesis komprehensif)",
          achievement:
            "Lulus dengan pujian sebagai mahasiswa aktif dalam kegiatan kampus",
        },
        {
          degree: "Sekolah Menengah Atas",
          institution: "SMAN 1 Tanah Grogot",
          period: "2012–2015",
        },
        {
          degree: "Sekolah Menengah Pertama",
          institution: "SMPN 1 Tanah Grogot",
          period: "2009–2012",
        },
        {
          degree: "Sekolah Dasar",
          institution: "SDN 014 Tanah Grogot",
          period: "2003–2009",
          description:
            "Mulai tertarik dengan matematika dan design bangunan, tapi tetap suka ngejar layangan walupun gak bisa main layangan.",
        },
        {
          degree: "Taman Kanak-Kanak",
          institution: "TK Pembina",
          period: "2002",
          description:
            "Pernah pulang sendiri sambil menangis karena lupa dijemput bapak",
        },
      ],
      workExperienceData: [
        {
          position: "Asisten Tenaga Ahli Menteri ESDM",
          company:
            "Kementerian Energi dan Sumber Daya Mineral Republik Indonesia - Bidang Percepatan Investasi dan Peningkatan Produksi Migas",
          period: "November 2025 – sekarang",
          responsibilities: [
            "Mendukung tenaga ahli dalam percepatan investasi sektor energi",
            "Mendukung peningkatan produksi migas",
            "Melakukan analisis dan koordinasi terkait kebijakan investasi energi",
          ],
        },
        {
          position: "Administrasi Umum",
          company: "Bagian Aset - Dinas Kesehatan Kabupaten Paser",
          period: "Maret 2025 – November 2025",
          responsibilities: [
            "Mengurus dokumen yang berhubungan dengan aset",
            "Menginventarisir data-data aset",
            "Melakukan pengecekan aset di dinas kesehatan dan seluruh UPTD",
          ],
        },
        {
          position: "Administrasi Umum",
          company:
            "UPTD Perbekalan Obat dan Alkes - Dinas Kesehatan Kabupaten Paser",
          period: "November 2023 – Maret 2025",
          responsibilities: [
            "Mengembangkan aplikasi manajemen data gudang farmasi",
            "Membuat dokumen perjalanan dinas (surat perjalanan dinas)",
            "Mendistribusikan obat ke 19 puskesmas",
            "Menyusun obat",
          ],
        },
        {
          position: "Chief Technology Officer",
          company: "Orvala Tour and Travel",
          period: "2020–2023",
          responsibilities: [
            "Berkolaborasi dengan web developer untuk membangun desain website yang user-friendly",
            "Memelihara dan memperbarui informasi di website",
            "Merencanakan itinerary perjalanan dan mempersiapkan peserta tour",
            "Membuat proses bisnis berbasis teknologi",
            "Membuat identitas merek perusahaan",
            "Membangun dan mengembangkan media sosial perusahaan secara organik dan anorganik",
          ],
        },
        {
          position: "Digital Marketing",
          company: "PT. Metatema Nusantara Abadi",
          period: "Maret 2022 – Agustus 2022",
          responsibilities: [
            "Bertanggung jawab untuk membuat dan mengimplementasikan strategi digital marketing dengan fokus pada peningkatan jumlah pengguna dan volume perdagangan cryptocurrency",
            "Mengelola semua akun media sosial untuk meningkatkan brand awareness produk",
          ],
        },
        {
          position: "Head of Media and Communications",
          company: "Indonesia Rusia Trade, Tourism and Investment Forum",
          period: "Maret 2023 – Juni 2023",
          responsibilities: [
            "Membuat website untuk mempublikasikan dan menyediakan informasi forum",
            "Mengkoordinasikan semua media yang diperlukan untuk mempublikasikan hasil forum",
            "Mempersiapkan perjalanan ke acara Eurasian Economic Forum di Moscow, Russia",
          ],
        },
      ],
      organizationsData: [
        {
          name: "Association of Indonesia Student in Russia (PERMIRA)",
          position: "Anggota Divisi Informasi, Komunikasi dan Teknologi",
          period: "2016-2017",
          description:
            "Bertanggung jawab untuk mengelola semua media sosial dan mengembangkan website organisasi. Membangun channel YouTube organisasi menjadi channel PPI pertama yang mencapai 10.000 subscriber.",
        },
        {
          name: "Overseas Indonesian Students Association Alliance (OISAA) America-Europe Region",
          position: "Kepala Divisi Informasi, Komunikasi dan Teknologi",
          period: "2017-2018",
          description:
            "Bertanggung jawab sebagai Kepala Divisi Informasi, Komunikasi, dan Teknologi untuk memimpin dan mengarahkan anggota divisi dalam memberikan dukungan untuk proyek organisasi dalam lingkup teknologi dan sistem informasi.",
        },
        {
          name: "10th International Symposium of Overseas Indonesian Students Association Alliance",
          position: "Anggota Divisi Graphic Design dan Publikasi",
          period: "2018",
          description:
            "Bertanggung jawab untuk membuat setiap desain grafis, seperti desain poster, desain flyer, template media sosial, proposal, dan mengelola semua media sosial yang digunakan untuk mempromosikan acara.",
        },
        {
          name: "6th OISAA Symposium America-Europe Region in Barcelona",
          position: "Anggota Divisi External Affair",
          period: "2019",
          description:
            "Membuat proposal acara untuk mengundang pembicara, melakukan follow up dengan setiap pembicara yang akan presentasi di acara, dan memberikan informasi acara lengkap kepada setiap peserta yang akan hadir.",
        },
      ],
      projectsData: [
        {
          name: "IRTTIF",
          description:
            "Serangkaian acara yang bertujuan untuk memupuk kerjasama antara Russia dan Indonesia di bidang pariwisata, perdagangan, dan investasi telah dilakukan di Jakarta dan Moscow.",
          link: "https://businesstoday.id/lewat-irttif-2023-indonesia-promosikan-pariwisata-dan-produk-umkm-dalam-negeri/",
        },
        {
          name: "Turu app",
          description:
            "Aplikasi sewa properti yang dibangun menggunakan React.js di front-end dengan framework CSS Chakra UI dan Express.js di back-end menggunakan database MySQL.",
          link: "https://github.com/imamahmadf/jcwdv100701",
        },
      ],
      interpreterExperienceData: [
        {
          event: "Trade Expo 2022",
          location: "BSD, Indonesia",
          role: "Interpreter di pertemuan formal dan non-formal",
        },
        {
          event: "Festival Indonesia 2017, 2018, 2019",
          location: "Moscow, Russia",
          role: "Interpreter Business Matcher dan Sales dari 2 perusahaan setiap tahun",
          period: "2017-2019",
        },
      ],
    },
    en: {
      currentPosition: "Current Position",
      education: "Education",
      workExperience: "Work Experience",
      skills: "Skills",
      favoriteFood: "Favorite Food & Drinks",
      projects: "Projects",
      organizations: "Organizational Experience",
      interpreterExperience: "Interpreter Experience",
      designMultimedia: "Design & Multimedia",
      development: "Development",
      tools: "Tools",
      viewProject: "View Project →",
      footerNote:
        "Developer of Official Travel Information System - Health Department",
      linkedinProfile: "LinkedIn Profile",
      currentWork: [
        "Supporting expert staff in energy sector investment acceleration",
        "Supporting oil and gas production increase",
        "Conducting analysis and coordination related to energy investment policies",
      ],
      educationData: [
        {
          degree: "Full Stack Web Developer",
          institution: "Purwadhika Digital Technology School",
          period: "August 2022 – February 2023",
          description:
            "Intensive JavaScript training to become a full-stack web developer within 12 weeks. Learning various technologies to build websites that meet industry needs. Collaborating to build real projects using agile methodologies.",
        },
        {
          degree: "Master of Railway Engineering",
          institution: "Rostov State Transport University Russia",
          period: "2015–2021",
          gpa: "3.79",
          specialization: "Specialist in passenger railway station management",
          thesis:
            "A variant of improving high-speed multimodal passenger transportation on the Jakarta-Bandung direction (comprehensive thesis)",
          achievement:
            "Graduated with distinction as an active student in campus activities",
        },
        {
          degree: "Senior High School",
          institution: "SMAN 1 Tanah Grogot",
          period: "2012–2015",
        },
        {
          degree: "Junior High School",
          institution: "SMPN 1 Tanah Grogot",
          period: "2009–2012",
        },
        {
          degree: "Elementary School",
          institution: "SDN 014 Tanah Grogot",
          period: "2003–2009",
          description:
            "Started to be interested in mathematics and building design, but still liked chasing kites even though couldn't fly kites.",
        },
        {
          degree: "Kindergarten",
          institution: "TK Pembina",
          period: "2002",
          description:
            "Once walked home alone crying because forgot to be picked up by father",
        },
      ],
      workExperienceData: [
        {
          position: "Assistant to Expert Staff of Minister of ESDM",
          company:
            "Ministry of Energy and Mineral Resources of the Republic of Indonesia - Investment Acceleration and Oil and Gas Production Increase",
          period: "November 2025 – present",
          responsibilities: [
            "Supporting expert staff in energy sector investment acceleration",
            "Supporting oil and gas production increase",
            "Conducting analysis and coordination related to energy investment policies",
          ],
        },
        {
          position: "General Administration",
          company: "Assets Section - Paser Regency Health Department",
          period: "March 2025 – November 2025",
          responsibilities: [
            "Managing documents related to assets",
            "Inventorying asset data",
            "Conducting asset checks at the health department and all UPTD",
          ],
        },
        {
          position: "General Administration",
          company:
            "UPTD Medical Supplies and Equipment - Paser Regency Health Department",
          period: "November 2023 – March 2025",
          responsibilities: [
            "Developing a pharmaceutical warehouse data management application",
            "Creating official travel documents (official travel letter)",
            "Distributing medicines to 19 community health centers",
            "Organizing medicines",
          ],
        },
        {
          position: "Chief Technology Officer",
          company: "Orvala Tour and Travel",
          period: "2020–2023",
          responsibilities: [
            "Collaborating with web developers to build a user-friendly website design",
            "Maintain and update information on the website",
            "Planning travel itineraries and preparing for tour participants",
            "Creating technology-based business processes",
            "Creating a company's brand identity",
            "Building and developing a company's social media organically and inorganically",
          ],
        },
        {
          position: "Digital Marketing",
          company: "PT. Metatema Nusantara Abadi",
          period: "March 2022 – August 2022",
          responsibilities: [
            "Responsible for creating and implementing digital marketing strategies with a focus on increasing the number of users and trade volume of cryptocurrencies",
            "Managing all social media accounts to increase product brand awareness",
          ],
        },
        {
          position: "Head of Media and Communications",
          company: "Indonesia Rusia Trade, Tourism and Investment Forum",
          period: "March 2023 – June 2023",
          responsibilities: [
            "Creating a website for publishing and providing forum information",
            "Coordinating all the necessary media to publicize the outcomes of the forum",
            "Preparing a trip to the Eurasian Economic Forum event in Moscow, Russia",
          ],
        },
      ],
      organizationsData: [
        {
          name: "Association of Indonesia Student in Russia (PERMIRA)",
          position:
            "Member of Information, communication and technology Division",
          period: "2016-2017",
          description:
            "Responsible for managing all social media and developing the organization's website. Building the organization's YouTube channel to become the first PPI channel to reach 10,000 subscribers.",
        },
        {
          name: "Overseas Indonesian Students Association Alliance (OISAA) America-Europe Region",
          position:
            "Head of Information, communication and technology division",
          period: "2017-2018",
          description:
            "Responsible as the Head of Information, Communication, and Technology Division to lead and direct division members in providing support for organization projects within the scope of technology and information systems.",
        },
        {
          name: "10th International Symposium of Overseas Indonesian Students Association Alliance",
          position: "Member of the Graphic Design and publications division",
          period: "2018",
          description:
            "Responsible for creating every graphic design, such as poster design, flyer design, social media templates, proposals, and managing all social media used to promote events.",
        },
        {
          name: "6th OISAA Symposium America-Europe Region in Barcelona",
          position: "Member of the external affair division",
          period: "2019",
          description:
            "Creating event proposals to invite speakers, following up with every speaker who will be presenting at the event, and providing complete event information to every attendee who will be present.",
        },
      ],
      projectsData: [
        {
          name: "IRTTIF",
          description:
            "A series of events aimed at fostering cooperation between Russia and Indonesia in the areas of tourism, trade, and investment has been conducted in Jakarta and Moscow.",
          link: "https://businesstoday.id/lewat-irttif-2023-indonesia-promosikan-pariwisata-dan-produk-umkm-dalam-negeri/",
        },
        {
          name: "Turu app",
          description:
            "Property rental application built using React.js on the front-end with the Chakra UI CSS framework and Express.js on the back-end using a MySQL database.",
          link: "https://github.com/imamahmadf/jcwdv100701",
        },
      ],
      interpreterExperienceData: [
        {
          event: "Trade Expo 2022",
          location: "BSD, Indonesia",
          role: "Interpreter at formal and non-formal meetings",
        },
        {
          event: "Festival Indonesia 2017, 2018, 2019",
          location: "Moscow, Russia",
          role: "Interpreter Business Matcher and Sales of 2 companies yearly",
          period: "2017-2019",
        },
      ],
    },
    ru: {
      currentPosition: "Текущая должность",
      education: "Образование",
      workExperience: "Опыт работы",
      skills: "Навыки",
      favoriteFood: "Любимая еда и напитки",
      projects: "Проекты",
      organizations: "Организационный опыт",
      interpreterExperience: "Опыт переводчика",
      designMultimedia: "Дизайн и мультимедиа",
      development: "Разработка",
      tools: "Инструменты",
      viewProject: "Посмотреть проект →",
      footerNote:
        "Разработчик приложения Информационной системы служебных поездок - Департамент здравоохранения",
      linkedinProfile: "Профиль LinkedIn",
      currentWork: [
        "Поддержка экспертного персонала в ускорении инвестиций в энергетический сектор",
        "Поддержка увеличения добычи нефти и газа",
        "Проведение анализа и координации, связанных с политикой инвестиций в энергетику",
      ],
      educationData: [
        {
          degree: "Full Stack Web Developer",
          institution: "Purwadhika Digital Technology School",
          period: "Август 2022 – Февраль 2023",
          description:
            "Интенсивное обучение JavaScript для становления full-stack веб-разработчиком в течение 12 недель. Изучение различных технологий для создания веб-сайтов, отвечающих потребностям отрасли. Сотрудничество в создании реальных проектов с использованием гибких методологий.",
        },
        {
          degree: "Магистр железнодорожного машиностроения",
          institution:
            "Ростовский государственный университет путей сообщения, Россия",
          period: "2015–2021",
          gpa: "3.79",
          specialization:
            "Специалист по управлению пассажирскими железнодорожными станциями",
          thesis:
            "Вариант улучшения высокоскоростной мультимодальной пассажирской перевозки в направлении Джакарта-Бандунг (комплексная диссертация)",
          achievement:
            "Окончил с отличием как активный студент в деятельности кампуса",
        },
        {
          degree: "Средняя школа",
          institution: "SMAN 1 Tanah Grogot",
          period: "2012–2015",
        },
        {
          degree: "Неполная средняя школа",
          institution: "SMPN 1 Tanah Grogot",
          period: "2009–2012",
        },
        {
          degree: "Начальная школа",
          institution: "SDN 014 Tanah Grogot",
          period: "2003–2009",
          description:
            "Начал интересоваться математикой и дизайном зданий, но все еще любил гоняться за воздушными змеями, хотя не умел их запускать.",
        },
        {
          degree: "Детский сад",
          institution: "TK Pembina",
          period: "2002",
          description:
            "Однажды шел домой один, плача, потому что забыли забрать отцом",
        },
      ],
      workExperienceData: [
        {
          position: "Ассистент экспертного персонала министра ESDM",
          company:
            "Министерство энергетики и минеральных ресурсов Республики Индонезия - Ускорение инвестиций и увеличение добычи нефти и газа",
          period: "Ноябрь 2025 – настоящее время",
          responsibilities: [
            "Поддержка экспертного персонала в ускорении инвестиций в энергетический сектор",
            "Поддержка увеличения добычи нефти и газа",
            "Проведение анализа и координации, связанных с политикой инвестиций в энергетику",
          ],
        },
        {
          position: "Общее администрирование",
          company: "Отдел активов - Департамент здравоохранения округа Пасер",
          period: "Март 2025 – Ноябрь 2025",
          responsibilities: [
            "Управление документами, связанными с активами",
            "Инвентаризация данных об активах",
            "Проведение проверок активов в департаменте здравоохранения и всех UPTD",
          ],
        },
        {
          position: "Общее администрирование",
          company:
            "UPTD Медицинские принадлежности и оборудование - Департамент здравоохранения округа Пасер",
          period: "Ноябрь 2023 – Март 2025",
          responsibilities: [
            "Разработка приложения для управления данными фармацевтического склада",
            "Создание официальных документов для служебных поездок (официальное письмо о поездке)",
            "Распределение лекарств в 19 центров общественного здравоохранения",
            "Организация лекарств",
          ],
        },
        {
          position: "Главный технический директор",
          company: "Orvala Tour and Travel",
          period: "2020–2023",
          responsibilities: [
            "Сотрудничество с веб-разработчиками для создания удобного дизайна веб-сайта",
            "Обслуживание и обновление информации на веб-сайте",
            "Планирование маршрутов поездок и подготовка участников тура",
            "Создание технологических бизнес-процессов",
            "Создание фирменного стиля компании",
            "Создание и развитие социальных сетей компании органически и неорганически",
          ],
        },
        {
          position: "Цифровой маркетинг",
          company: "PT. Metatema Nusantara Abadi",
          period: "Март 2022 – Август 2022",
          responsibilities: [
            "Ответственность за создание и реализацию стратегий цифрового маркетинга с акцентом на увеличение количества пользователей и объема торговли криптовалютами",
            "Управление всеми аккаунтами в социальных сетях для повышения узнаваемости бренда продукта",
          ],
        },
        {
          position: "Руководитель отдела медиа и коммуникаций",
          company: "Форум торговли, туризма и инвестиций Индонезия-Россия",
          period: "Март 2023 – Июнь 2023",
          responsibilities: [
            "Создание веб-сайта для публикации и предоставления информации о форуме",
            "Координация всех необходимых медиа для публикации результатов форума",
            "Подготовка поездки на мероприятие Евразийского экономического форума в Москве, Россия",
          ],
        },
      ],
      organizationsData: [
        {
          name: "Ассоциация индонезийских студентов в России (PERMIRA)",
          position: "Член отдела информации, коммуникаций и технологий",
          period: "2016-2017",
          description:
            "Ответственность за управление всеми социальными сетями и разработку веб-сайта организации. Создание YouTube-канала организации, который стал первым каналом PPI, достигшим 10 000 подписчиков.",
        },
        {
          name: "Альянс ассоциаций индонезийских студентов за рубежом (OISAA) Регион Америка-Европа",
          position: "Руководитель отдела информации, коммуникаций и технологий",
          period: "2017-2018",
          description:
            "Ответственность как руководителя отдела информации, коммуникаций и технологий за руководство и направление членов отдела в оказании поддержки проектам организации в области технологий и информационных систем.",
        },
        {
          name: "10-й Международный симпозиум Альянса ассоциаций индонезийских студентов за рубежом",
          position: "Член отдела графического дизайна и публикаций",
          period: "2018",
          description:
            "Ответственность за создание каждого графического дизайна, такого как дизайн постеров, дизайн флаеров, шаблоны социальных сетей, предложения и управление всеми социальными сетями, используемыми для продвижения мероприятий.",
        },
        {
          name: "6-й симпозиум OISAA Регион Америка-Европа в Барселоне",
          position: "Член отдела внешних связей",
          period: "2019",
          description:
            "Создание предложений для мероприятий по приглашению докладчиков, последующая работа с каждым докладчиком, который будет выступать на мероприятии, и предоставление полной информации о мероприятии каждому участнику, который будет присутствовать.",
        },
      ],
      projectsData: [
        {
          name: "IRTTIF",
          description:
            "Серия мероприятий, направленных на развитие сотрудничества между Россией и Индонезией в области туризма, торговли и инвестиций, была проведена в Джакарте и Москве.",
          link: "https://businesstoday.id/lewat-irttif-2023-indonesia-promosikan-pariwisata-dan-produk-umkm-dalam-negeri/",
        },
        {
          name: "Turu app",
          description:
            "Приложение для аренды недвижимости, построенное с использованием React.js на фронтенде с CSS-фреймворком Chakra UI и Express.js на бэкенде с использованием базы данных MySQL.",
          link: "https://github.com/imamahmadf/jcwdv100701",
        },
      ],
      interpreterExperienceData: [
        {
          event: "Trade Expo 2022",
          location: "BSD, Индонезия",
          role: "Переводчик на формальных и неформальных встречах",
        },
        {
          event: "Фестиваль Индонезии 2017, 2018, 2019",
          location: "Москва, Россия",
          role: "Переводчик Business Matcher и продажи 2 компаний ежегодно",
          period: "2017-2019",
        },
      ],
    },
  };

  const t = translations[language];

  const developerData = {
    name: "Imam Ahmad Fahrurazi",
    birthPlace: "Ujung Pandang",
    birthDate: "28 September 1997",
    location: "Tanah Grogot, Paser district, East Kalimantan province",
    email: "imamahmadfahrurazi@gmail.com",
    phone: "08*******579",
    linkedin: "www.linkedin.com/in/imam-ahmad-fahrurazi",
    currentPosition:
      language === "id"
        ? "Asisten Tenaga Ahli Menteri ESDM - Bidang Percepatan Investasi dan Peningkatan Produksi Migas"
        : language === "ru"
        ? "Ассистент экспертного персонала министра ESDM - Ускорение инвестиций и увеличение добычи нефти и газа"
        : "Assistant to Expert Staff of Minister of ESDM - Investment Acceleration and Oil and Gas Production Increase",
    currentPeriod:
      language === "id"
        ? "November 2025 - sekarang"
        : language === "ru"
        ? "Ноябрь 2025 - настоящее время"
        : "November 2025 - present",
  };

  const skills = {
    design: [
      "Auto Cad",
      "Adobe Premier Pro",
      "Adobe After Effect",
      "Corel Draw",
      "Adobe Lightroom",
      "Adobe Illustrator",
      "Figma",
    ],
    development: ["Javascript", "PHP"],
    tools: ["Word", "Excel", "ClickUp"],
  };

  const favoriteFoods = {
    id: ["Nasi Goreng", "Es Cendol", "Jus Mangga"],
    en: ["Fried Rice", "Cendol Ice", "Mango Juice"],
    ru: ["Жареный рис", "Цендол (лед)", "Манговый сок"],
  };

  return (
    <Layout>
      <Box bgColor={"secondary"} pb={"40px"} px={"30px"} minH={"100vh"}>
        <Container
          maxW={"1280px"}
          bgColor={bgColor}
          borderRadius={"6px"}
          border={"1px"}
          borderColor={borderColor}
          pt={"40px"}
          pb={"40px"}
          px={"40px"}
          mt={"40px"}
        >
          {/* Language Selector */}
          <Flex justify="flex-end" mb={4}>
            <HStack>
              <Icon as={FaLanguage} color={primaryColor} />
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                variant="outline"
                colorScheme={primaryColor}
                size="sm"
                width="150px"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </Select>
            </HStack>
          </Flex>

          {/* Header Section */}
          <VStack spacing={4} align="stretch" mb={8}>
            <Heading
              fontSize={"36px"}
              fontWeight={"700"}
              color={primaryColor}
              mb={2}
            >
              {developerData.name}
            </Heading>
            <Text fontSize={"16px"} color={"gray.600"}>
              {developerData.birthPlace}, {developerData.birthDate}
            </Text>
            <Text fontSize={"16px"} color={"gray.600"}>
              {developerData.location}
            </Text>

            {/* Contact Information */}
            <HStack spacing={6} mt={4} flexWrap="wrap">
              <HStack>
                <Icon as={FaEnvelope} color={primaryColor} />
                <Link
                  href={`mailto:${developerData.email}`}
                  color={primaryColor}
                >
                  {developerData.email}
                </Link>
              </HStack>
              <HStack>
                <Icon as={FaPhone} color={primaryColor} />
                <Text>{developerData.phone}</Text>
              </HStack>
              <HStack>
                <Icon as={FaLinkedin} color={primaryColor} />
                <Link
                  href={`https://${developerData.linkedin}`}
                  isExternal
                  color={primaryColor}
                >
                  {t.linkedinProfile}
                </Link>
              </HStack>
            </HStack>
          </VStack>

          <Divider mb={8} />

          {/* Current Position */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon as={FaBriefcase} color={primaryColor} fontSize={"24px"} />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.currentPosition}
              </Heading>
            </HStack>
            <Box
              p={4}
              bgColor={"terang"}
              borderRadius={"6px"}
              borderLeft={"4px solid"}
              borderColor={primaryColor}
              ml={8}
            >
              <Text fontSize={"18px"} fontWeight={"600"} mb={2}>
                {developerData.currentPosition}
              </Text>
              <Text fontSize={"14px"} color={"gray.600"} mb={3}>
                {developerData.currentPeriod}
              </Text>
              <VStack align="stretch" spacing={2}>
                {t.currentWork.map((work, index) => (
                  <Text key={index} fontSize={"14px"}>
                    • {work}
                  </Text>
                ))}
              </VStack>
            </Box>
          </Box>

          <Divider mb={8} />

          {/* Education */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon
                as={FaGraduationCap}
                color={primaryColor}
                fontSize={"24px"}
              />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.education}
              </Heading>
            </HStack>
            <VStack align="stretch" spacing={4} ml={8}>
              {t.educationData.map((edu, index) => (
                <Box
                  key={index}
                  p={4}
                  bgColor={"terang"}
                  borderRadius={"6px"}
                  borderLeft={"4px solid"}
                  borderColor={primaryColor}
                >
                  <Text fontSize={"18px"} fontWeight={"600"} mb={1}>
                    {edu.degree}
                  </Text>
                  <Text fontSize={"16px"} color={primaryColor} mb={1}>
                    {edu.institution}
                  </Text>
                  <Text fontSize={"14px"} color={"gray.600"} mb={2}>
                    {edu.period}
                  </Text>
                  {edu.gpa && (
                    <Badge colorScheme="green" mb={2}>
                      GPA: {edu.gpa}
                    </Badge>
                  )}
                  {edu.specialization && (
                    <Text fontSize={"14px"} mb={2}>
                      {edu.specialization}
                    </Text>
                  )}
                  {edu.thesis && (
                    <Text fontSize={"14px"} mb={2} fontStyle="italic">
                      {language === "id" ? "Tesis: " : "Thesis: "}
                      {edu.thesis}
                    </Text>
                  )}
                  {edu.achievement && (
                    <Text
                      fontSize={"14px"}
                      color={"green.600"}
                      fontWeight={"500"}
                    >
                      {edu.achievement}
                    </Text>
                  )}
                  {edu.description && (
                    <Text fontSize={"14px"} mt={2}>
                      {edu.description}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider mb={8} />

          {/* Work Experience */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon as={FaBriefcase} color={primaryColor} fontSize={"24px"} />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.workExperience}
              </Heading>
            </HStack>
            <VStack align="stretch" spacing={4} ml={8}>
              {t.workExperienceData.map((work, index) => (
                <Box
                  key={index}
                  p={4}
                  bgColor={"terang"}
                  borderRadius={"6px"}
                  borderLeft={"4px solid"}
                  borderColor={primaryColor}
                >
                  <Text fontSize={"18px"} fontWeight={"600"} mb={1}>
                    {work.position}
                  </Text>
                  <Text fontSize={"16px"} color={primaryColor} mb={1}>
                    {work.company}
                  </Text>
                  <Text fontSize={"14px"} color={"gray.600"} mb={3}>
                    {work.period}
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {work.responsibilities.map((resp, idx) => (
                      <Text key={idx} fontSize={"14px"}>
                        • {resp}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider mb={8} />

          {/* Skills */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon as={FaCode} color={primaryColor} fontSize={"24px"} />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.skills}
              </Heading>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} ml={8}>
              <Box p={4} bgColor={"terang"} borderRadius={"6px"}>
                <Text
                  fontSize={"16px"}
                  fontWeight={"600"}
                  mb={3}
                  color={primaryColor}
                >
                  {t.designMultimedia}
                </Text>
                <VStack align="stretch" spacing={2}>
                  {skills.design.map((skill, index) => (
                    <Badge
                      key={index}
                      colorScheme="blue"
                      p={2}
                      textAlign="center"
                    >
                      {skill}
                    </Badge>
                  ))}
                </VStack>
              </Box>
              <Box p={4} bgColor={"terang"} borderRadius={"6px"}>
                <Text
                  fontSize={"16px"}
                  fontWeight={"600"}
                  mb={3}
                  color={primaryColor}
                >
                  {t.development}
                </Text>
                <VStack align="stretch" spacing={2}>
                  {skills.development.map((skill, index) => (
                    <Badge
                      key={index}
                      colorScheme="green"
                      p={2}
                      textAlign="center"
                    >
                      {skill}
                    </Badge>
                  ))}
                </VStack>
              </Box>
              <Box p={4} bgColor={"terang"} borderRadius={"6px"}>
                <Text
                  fontSize={"16px"}
                  fontWeight={"600"}
                  mb={3}
                  color={primaryColor}
                >
                  {t.tools}
                </Text>
                <VStack align="stretch" spacing={2}>
                  {skills.tools.map((skill, index) => (
                    <Badge
                      key={index}
                      colorScheme="purple"
                      p={2}
                      textAlign="center"
                    >
                      {skill}
                    </Badge>
                  ))}
                </VStack>
              </Box>
            </SimpleGrid>
          </Box>

          <Divider mb={8} />

          {/* Favorite Food & Drinks */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon as={FaUtensils} color={primaryColor} fontSize={"24px"} />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.favoriteFood}
              </Heading>
            </HStack>
            <Box ml={8}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {favoriteFoods[language].map((food, index) => (
                  <Box
                    key={index}
                    p={4}
                    bgColor={"terang"}
                    borderRadius={"6px"}
                    textAlign="center"
                  >
                    <Badge
                      colorScheme="orange"
                      fontSize={"16px"}
                      p={3}
                      borderRadius={"6px"}
                    >
                      {food}
                    </Badge>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </Box>

          <Divider mb={8} />

          {/* Projects */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon as={FaGlobe} color={primaryColor} fontSize={"24px"} />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.projects}
              </Heading>
            </HStack>
            <VStack align="stretch" spacing={4} ml={8}>
              {t.projectsData.map((project, index) => (
                <Box
                  key={index}
                  p={4}
                  bgColor={"terang"}
                  borderRadius={"6px"}
                  borderLeft={"4px solid"}
                  borderColor={primaryColor}
                >
                  <Text fontSize={"18px"} fontWeight={"600"} mb={2}>
                    {project.name}
                  </Text>
                  <Text fontSize={"14px"} mb={2}>
                    {project.description}
                  </Text>
                  <Link
                    href={project.link}
                    isExternal
                    color={primaryColor}
                    fontSize={"14px"}
                  >
                    {t.viewProject}
                  </Link>
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider mb={8} />

          {/* Organizational Experience */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon as={FaUsers} color={primaryColor} fontSize={"24px"} />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.organizations}
              </Heading>
            </HStack>
            <VStack align="stretch" spacing={4} ml={8}>
              {t.organizationsData.map((org, index) => (
                <Box
                  key={index}
                  p={4}
                  bgColor={"terang"}
                  borderRadius={"6px"}
                  borderLeft={"4px solid"}
                  borderColor={primaryColor}
                >
                  <Text fontSize={"18px"} fontWeight={"600"} mb={1}>
                    {org.name}
                  </Text>
                  <Text fontSize={"16px"} color={primaryColor} mb={1}>
                    {org.position}
                  </Text>
                  <Text fontSize={"14px"} color={"gray.600"} mb={2}>
                    {org.period}
                  </Text>
                  <Text fontSize={"14px"}>{org.description}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider mb={8} />

          {/* Interpreter Experience */}
          <Box mb={8}>
            <HStack mb={4}>
              <Icon as={FaGlobe} color={primaryColor} fontSize={"24px"} />
              <Heading fontSize={"24px"} fontWeight={"600"}>
                {t.interpreterExperience}
              </Heading>
            </HStack>
            <VStack align="stretch" spacing={4} ml={8}>
              {t.interpreterExperienceData.map((exp, index) => (
                <Box
                  key={index}
                  p={4}
                  bgColor={"terang"}
                  borderRadius={"6px"}
                  borderLeft={"4px solid"}
                  borderColor={primaryColor}
                >
                  <Text fontSize={"18px"} fontWeight={"600"} mb={1}>
                    {exp.event}
                  </Text>
                  <Text fontSize={"14px"} color={"gray.600"} mb={1}>
                    {exp.location}
                  </Text>
                  {exp.period && (
                    <Text fontSize={"14px"} color={"gray.600"} mb={2}>
                      {exp.period}
                    </Text>
                  )}
                  <Text fontSize={"14px"}>{exp.role}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          {/* Footer Note */}
          <Box
            mt={8}
            p={4}
            bgColor={"terang"}
            borderRadius={"6px"}
            textAlign="center"
          >
            <Text fontSize={"14px"} color={"gray.600"}>
              {t.footerNote}
            </Text>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}

export default DeveloperProfile;
