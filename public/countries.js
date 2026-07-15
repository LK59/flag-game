const allCountries = [
    {
        "id": "al",
        "name": "Albanie",
        "continent": "Europe"
    },
    {
        "id": "de",
        "name": "Allemagne",
        "continent": "Europe",
        "alt": [
            "germany",
            "allemagne"
        ]
    },
    {
        "id": "ad",
        "name": "Andorre",
        "continent": "Europe"
    },
    {
        "id": "at",
        "name": "Autriche",
        "continent": "Europe",
        "alt": [
            "austria"
        ]
    },
    {
        "id": "be",
        "name": "Belgique",
        "continent": "Europe",
        "alt": [
            "belgium"
        ]
    },
    {
        "id": "by",
        "name": "Biélorussie",
        "continent": "Europe",
        "alt": [
            "belarus"
        ]
    },
    {
        "id": "ba",
        "name": "Bosnie-Herzégovine",
        "continent": "Europe",
        "alt": [
            "bosnie",
            "bosnie-herzegovine",
            "bosnie herzegovine",
            "bosnia"
        ]
    },
    {
        "id": "bg",
        "name": "Bulgarie",
        "continent": "Europe"
    },
    {
        "id": "cy",
        "name": "Chypre",
        "continent": "Europe",
        "alt": [
            "cyprus"
        ]
    },
    {
        "id": "hr",
        "name": "Croatie",
        "continent": "Europe",
        "alt": [
            "croatia"
        ]
    },
    {
        "id": "dk",
        "name": "Danemark",
        "continent": "Europe",
        "alt": [
            "denmark"
        ]
    },
    {
        "id": "es",
        "name": "Espagne",
        "continent": "Europe",
        "alt": [
            "spain",
            "espagne"
        ]
    },
    {
        "id": "ee",
        "name": "Estonie",
        "continent": "Europe",
        "alt": [
            "estonia"
        ]
    },
    {
        "id": "fi",
        "name": "Finlande",
        "continent": "Europe",
        "alt": [
            "finland"
        ]
    },
    {
        "id": "fr",
        "name": "France",
        "continent": "Europe"
    },
    {
        "id": "gr",
        "name": "Grèce",
        "continent": "Europe",
        "alt": [
            "greece"
        ]
    },
    {
        "id": "hu",
        "name": "Hongrie",
        "continent": "Europe",
        "alt": [
            "hungary"
        ]
    },
    {
        "id": "ie",
        "name": "Irlande",
        "continent": "Europe",
        "alt": [
            "ireland"
        ]
    },
    {
        "id": "is",
        "name": "Islande",
        "continent": "Europe",
        "alt": [
            "iceland"
        ]
    },
    {
        "id": "it",
        "name": "Italie",
        "continent": "Europe",
        "alt": [
            "italie",
            "italy"
        ]
    },
    {
        "id": "xk",
        "name": "Kosovo",
        "continent": "Europe"
    },
    {
        "id": "lv",
        "name": "Lettonie",
        "continent": "Europe",
        "alt": [
            "latvia"
        ]
    },
    {
        "id": "li",
        "name": "Liechtenstein",
        "continent": "Europe"
    },
    {
        "id": "lt",
        "name": "Lituanie",
        "continent": "Europe",
        "alt": [
            "lithuania"
        ]
    },
    {
        "id": "lu",
        "name": "Luxembourg",
        "continent": "Europe"
    },
    {
        "id": "mk",
        "name": "Macédoine du Nord",
        "continent": "Europe",
        "alt": [
            "macedoine",
            "macedonia",
            "macedoine du nord"
        ]
    },
    {
        "id": "mt",
        "name": "Malte",
        "continent": "Europe",
        "alt": [
            "malta"
        ]
    },
    {
        "id": "md",
        "name": "Moldavie",
        "continent": "Europe",
        "alt": [
            "moldova"
        ]
    },
    {
        "id": "mc",
        "name": "Monaco",
        "continent": "Europe"
    },
    {
        "id": "me",
        "name": "Monténégro",
        "continent": "Europe",
        "alt": [
            "montenegro"
        ]
    },
    {
        "id": "no",
        "name": "Norvège",
        "continent": "Europe",
        "alt": [
            "norway"
        ]
    },
    {
        "id": "nl",
        "name": "Pays-Bas",
        "continent": "Europe",
        "alt": [
            "pays bas",
            "hollande",
            "netherlands",
            "pays-bas"
        ]
    },
    {
        "id": "pl",
        "name": "Pologne",
        "continent": "Europe",
        "alt": [
            "poland"
        ]
    },
    {
        "id": "pt",
        "name": "Portugal",
        "continent": "Europe"
    },
    {
        "id": "cz",
        "name": "République Tchèque",
        "continent": "Europe",
        "alt": [
            "republique tcheque",
            "czechia",
            "tchequie",
            "rep tcheque",
            "czech",
            "czech republic",
            "tcheque"
        ]
    },
    {
        "id": "ro",
        "name": "Roumanie",
        "continent": "Europe",
        "alt": [
            "romania"
        ]
    },
    {
        "id": "gb",
        "name": "Royaume-Uni",
        "continent": "Europe",
        "alt": [
            "uk",
            "angleterre",
            "england",
            "grande bretagne",
            "royaume uni",
            "royaume-uni"
        ]
    },
    {
        "id": "ru",
        "name": "Russie",
        "continent": "Europe",
        "alt": [
            "russie",
            "russia"
        ]
    },
    {
        "id": "sm",
        "name": "Saint-Marin",
        "continent": "Europe",
        "alt": [
            "san marino"
        ]
    },
    {
        "id": "rs",
        "name": "Serbie",
        "continent": "Europe",
        "alt": [
            "serbia"
        ]
    },
    {
        "id": "sk",
        "name": "Slovaquie",
        "continent": "Europe",
        "alt": [
            "slovakia"
        ]
    },
    {
        "id": "si",
        "name": "Slovénie",
        "continent": "Europe",
        "alt": [
            "slovenia"
        ]
    },
    {
        "id": "se",
        "name": "Suède",
        "continent": "Europe",
        "alt": [
            "suede",
            "sweden"
        ]
    },
    {
        "id": "ch",
        "name": "Suisse",
        "continent": "Europe",
        "alt": [
            "switzerland"
        ]
    },
    {
        "id": "ua",
        "name": "Ukraine",
        "continent": "Europe"
    },
    {
        "id": "va",
        "name": "Vatican",
        "continent": "Europe",
        "alt": [
            "saint-siege",
            "vatican",
            "saint siege"
        ]
    },
    {
        "id": "za",
        "name": "Afrique du Sud",
        "continent": "Afrique",
        "alt": [
            "afrique du sud",
            "rsa",
            "south africa",
            "afrique sud"
        ]
    },
    {
        "id": "dz",
        "name": "Algérie",
        "continent": "Afrique",
        "alt": [
            "algeria"
        ]
    },
    {
        "id": "ao",
        "name": "Angola",
        "continent": "Afrique"
    },
    {
        "id": "bj",
        "name": "Bénin",
        "continent": "Afrique",
        "alt": [
            "benin"
        ]
    },
    {
        "id": "bw",
        "name": "Botswana",
        "continent": "Afrique"
    },
    {
        "id": "bf",
        "name": "Burkina Faso",
        "continent": "Afrique",
        "alt": [
            "burkina"
        ]
    },
    {
        "id": "bi",
        "name": "Burundi",
        "continent": "Afrique"
    },
    {
        "id": "cm",
        "name": "Cameroun",
        "continent": "Afrique",
        "alt": [
            "cameroon"
        ]
    },
    {
        "id": "cv",
        "name": "Cap-Vert",
        "continent": "Afrique",
        "alt": [
            "cap-vert",
            "cap vert",
            "cape verde"
        ]
    },
    {
        "id": "cf",
        "name": "République Centrafricaine",
        "continent": "Afrique",
        "alt": [
            "republique centrafricaine",
            "centrafrique",
            "rca"
        ]
    },
    {
        "id": "km",
        "name": "Comores",
        "continent": "Afrique",
        "alt": [
            "comoros"
        ]
    },
    {
        "id": "cg",
        "name": "Congo",
        "continent": "Afrique",
        "alt": [
            "congo brazzaville",
            "congo",
            "congo-brazzaville"
        ]
    },
    {
        "id": "cd",
        "name": "République Démocratique du Congo",
        "continent": "Afrique",
        "alt": [
            "drc",
            "rdc",
            "congo democratique",
            "zaire",
            "republique democratique du congo"
        ]
    },
    {
        "id": "ci",
        "name": "Côte d'Ivoire",
        "continent": "Afrique",
        "alt": [
            "ivory coast",
            "cote divoire",
            "cotedivoire",
            "cote d'ivoire"
        ]
    },
    {
        "id": "dj",
        "name": "Djibouti",
        "continent": "Afrique"
    },
    {
        "id": "eg",
        "name": "Égypte",
        "continent": "Afrique",
        "alt": [
            "egypt"
        ]
    },
    {
        "id": "er",
        "name": "Érythrée",
        "continent": "Afrique",
        "alt": [
            "eritrea"
        ]
    },
    {
        "id": "sz",
        "name": "Eswatini",
        "continent": "Afrique",
        "alt": [
            "swaziland"
        ]
    },
    {
        "id": "et",
        "name": "Éthiopie",
        "continent": "Afrique",
        "alt": [
            "ethiopia"
        ]
    },
    {
        "id": "ga",
        "name": "Gabon",
        "continent": "Afrique"
    },
    {
        "id": "gm",
        "name": "Gambie",
        "continent": "Afrique",
        "alt": [
            "gambia"
        ]
    },
    {
        "id": "gh",
        "name": "Ghana",
        "continent": "Afrique"
    },
    {
        "id": "gn",
        "name": "Guinée",
        "continent": "Afrique",
        "alt": [
            "guinea"
        ]
    },
    {
        "id": "gw",
        "name": "Guinée-Bissau",
        "continent": "Afrique",
        "alt": [
            "guinee bissau",
            "guinee-bissau",
            "guinea bissau"
        ]
    },
    {
        "id": "gq",
        "name": "Guinée Équatoriale",
        "continent": "Afrique",
        "alt": [
            "guinee equatoriale",
            "equatorial guinea"
        ]
    },
    {
        "id": "ke",
        "name": "Kenya",
        "continent": "Afrique"
    },
    {
        "id": "ls",
        "name": "Lesotho",
        "continent": "Afrique"
    },
    {
        "id": "lr",
        "name": "Libéria",
        "continent": "Afrique",
        "alt": [
            "liberia"
        ]
    },
    {
        "id": "ly",
        "name": "Libye",
        "continent": "Afrique",
        "alt": [
            "libya"
        ]
    },
    {
        "id": "mg",
        "name": "Madagascar",
        "continent": "Afrique"
    },
    {
        "id": "mw",
        "name": "Malawi",
        "continent": "Afrique"
    },
    {
        "id": "ml",
        "name": "Mali",
        "continent": "Afrique"
    },
    {
        "id": "ma",
        "name": "Maroc",
        "continent": "Afrique",
        "alt": [
            "morocco"
        ]
    },
    {
        "id": "mu",
        "name": "Maurice",
        "continent": "Afrique",
        "alt": [
            "ile maurice",
            "mauritius"
        ]
    },
    {
        "id": "mr",
        "name": "Mauritanie",
        "continent": "Afrique",
        "alt": [
            "mauritania"
        ]
    },
    {
        "id": "mz",
        "name": "Mozambique",
        "continent": "Afrique"
    },
    {
        "id": "na",
        "name": "Namibie",
        "continent": "Afrique",
        "alt": [
            "namibia"
        ]
    },
    {
        "id": "ne",
        "name": "Niger",
        "continent": "Afrique"
    },
    {
        "id": "ng",
        "name": "Nigeria",
        "continent": "Afrique"
    },
    {
        "id": "ug",
        "name": "Ouganda",
        "continent": "Afrique",
        "alt": [
            "uganda"
        ]
    },
    {
        "id": "rw",
        "name": "Rwanda",
        "continent": "Afrique"
    },
    {
        "id": "st",
        "name": "Sao Tomé-et-Principe",
        "continent": "Afrique",
        "alt": [
            "sao tome et principe",
            "sao tome-et-principe",
            "sao tome"
        ]
    },
    {
        "id": "sn",
        "name": "Sénégal",
        "continent": "Afrique",
        "alt": [
            "senegal"
        ]
    },
    {
        "id": "sc",
        "name": "Seychelles",
        "continent": "Afrique"
    },
    {
        "id": "sl",
        "name": "Sierra Leone",
        "continent": "Afrique"
    },
    {
        "id": "so",
        "name": "Somalie",
        "continent": "Afrique",
        "alt": [
            "somalia"
        ]
    },
    {
        "id": "sd",
        "name": "Soudan",
        "continent": "Afrique",
        "alt": [
            "sudan"
        ]
    },
    {
        "id": "ss",
        "name": "Soudan du Sud",
        "continent": "Afrique",
        "alt": [
            "south sudan",
            "soudan sud",
            "soudan du sud"
        ]
    },
    {
        "id": "tz",
        "name": "Tanzanie",
        "continent": "Afrique",
        "alt": [
            "tanzania"
        ]
    },
    {
        "id": "td",
        "name": "Tchad",
        "continent": "Afrique",
        "alt": [
            "chad"
        ]
    },
    {
        "id": "tg",
        "name": "Togo",
        "continent": "Afrique"
    },
    {
        "id": "tn",
        "name": "Tunisie",
        "continent": "Afrique",
        "alt": [
            "tunisia"
        ]
    },
    {
        "id": "zm",
        "name": "Zambie",
        "continent": "Afrique",
        "alt": [
            "zambia"
        ]
    },
    {
        "id": "zw",
        "name": "Zimbabwe",
        "continent": "Afrique"
    },
    {
        "id": "af",
        "name": "Afghanistan",
        "continent": "Asie"
    },
    {
        "id": "sa",
        "name": "Arabie Saoudite",
        "continent": "Asie",
        "alt": [
            "saudi arabia",
            "arabie",
            "arabie saoudite",
            "arabie-saoudite"
        ]
    },
    {
        "id": "am",
        "name": "Arménie",
        "continent": "Asie",
        "alt": [
            "armenia"
        ]
    },
    {
        "id": "az",
        "name": "Azerbaïdjan",
        "continent": "Asie",
        "alt": [
            "azerbaijan"
        ]
    },
    {
        "id": "bh",
        "name": "Bahreïn",
        "continent": "Asie",
        "alt": [
            "bahrain"
        ]
    },
    {
        "id": "bd",
        "name": "Bangladesh",
        "continent": "Asie"
    },
    {
        "id": "bt",
        "name": "Bhoutan",
        "continent": "Asie",
        "alt": [
            "bhutan"
        ]
    },
    {
        "id": "mm",
        "name": "Birmanie",
        "continent": "Asie",
        "alt": [
            "myanmar"
        ]
    },
    {
        "id": "bn",
        "name": "Brunei",
        "continent": "Asie"
    },
    {
        "id": "kh",
        "name": "Cambodge",
        "continent": "Asie",
        "alt": [
            "cambodia"
        ]
    },
    {
        "id": "cn",
        "name": "Chine",
        "continent": "Asie",
        "alt": [
            "china",
            "chine",
            "rpc"
        ]
    },
    {
        "id": "kp",
        "name": "Corée du Nord",
        "continent": "Asie",
        "alt": [
            "coree du nord",
            "north korea",
            "rpdc",
            "coree nord"
        ]
    },
    {
        "id": "kr",
        "name": "Corée du Sud",
        "continent": "Asie",
        "alt": [
            "south korea",
            "coree sud",
            "coree du sud"
        ]
    },
    {
        "id": "ae",
        "name": "Émirats Arabes Unis",
        "continent": "Asie",
        "alt": [
            "uae",
            "eau",
            "emirats",
            "emirats arabes unis"
        ]
    },
    {
        "id": "ge",
        "name": "Géorgie",
        "continent": "Asie",
        "alt": [
            "georgia"
        ]
    },
    {
        "id": "in",
        "name": "Inde",
        "continent": "Asie",
        "alt": [
            "india"
        ]
    },
    {
        "id": "id",
        "name": "Indonésie",
        "continent": "Asie",
        "alt": [
            "indonesia"
        ]
    },
    {
        "id": "iq",
        "name": "Irak",
        "continent": "Asie",
        "alt": [
            "iraq"
        ]
    },
    {
        "id": "ir",
        "name": "Iran",
        "continent": "Asie"
    },
    {
        "id": "il",
        "name": "Israël",
        "continent": "Asie",
        "alt": [
            "israel"
        ]
    },
    {
        "id": "jp",
        "name": "Japon",
        "continent": "Asie",
        "alt": [
            "japon",
            "japan"
        ]
    },
    {
        "id": "jo",
        "name": "Jordanie",
        "continent": "Asie",
        "alt": [
            "jordan"
        ]
    },
    {
        "id": "kz",
        "name": "Kazakhstan",
        "continent": "Asie"
    },
    {
        "id": "kg",
        "name": "Kirghizistan",
        "continent": "Asie",
        "alt": [
            "kyrgyzstan"
        ]
    },
    {
        "id": "kw",
        "name": "Koweït",
        "continent": "Asie",
        "alt": [
            "kuwait"
        ]
    },
    {
        "id": "la",
        "name": "Laos",
        "continent": "Asie"
    },
    {
        "id": "lb",
        "name": "Liban",
        "continent": "Asie",
        "alt": [
            "lebanon"
        ]
    },
    {
        "id": "my",
        "name": "Malaisie",
        "continent": "Asie",
        "alt": [
            "malaysia"
        ]
    },
    {
        "id": "mv",
        "name": "Maldives",
        "continent": "Asie"
    },
    {
        "id": "mn",
        "name": "Mongolie",
        "continent": "Asie",
        "alt": [
            "mongolia"
        ]
    },
    {
        "id": "np",
        "name": "Népal",
        "continent": "Asie",
        "alt": [
            "nepal"
        ]
    },
    {
        "id": "om",
        "name": "Oman",
        "continent": "Asie"
    },
    {
        "id": "uz",
        "name": "Ouzbékistan",
        "continent": "Asie",
        "alt": [
            "uzbekistan"
        ]
    },
    {
        "id": "pk",
        "name": "Pakistan",
        "continent": "Asie"
    },
    {
        "id": "ph",
        "name": "Philippines",
        "continent": "Asie"
    },
    {
        "id": "qa",
        "name": "Qatar",
        "continent": "Asie"
    },
    {
        "id": "sg",
        "name": "Singapour",
        "continent": "Asie",
        "alt": [
            "singapore"
        ]
    },
    {
        "id": "lk",
        "name": "Sri Lanka",
        "continent": "Asie",
        "alt": [
            "sri lanka",
            "srilanka"
        ]
    },
    {
        "id": "sy",
        "name": "Syrie",
        "continent": "Asie",
        "alt": [
            "syria"
        ]
    },
    {
        "id": "tj",
        "name": "Tadjikistan",
        "continent": "Asie",
        "alt": [
            "tajikistan"
        ]
    },
    {
        "id": "tw",
        "name": "Taïwan",
        "continent": "Asie",
        "alt": [
            "taiwan",
            "republique de chine"
        ]
    },
    {
        "id": "th",
        "name": "Thaïlande",
        "continent": "Asie",
        "alt": [
            "thailand"
        ]
    },
    {
        "id": "tl",
        "name": "Timor oriental",
        "continent": "Asie",
        "alt": [
            "timor",
            "east timor",
            "timor oriental",
            "timor-oriental"
        ]
    },
    {
        "id": "tm",
        "name": "Turkménistan",
        "continent": "Asie",
        "alt": [
            "turkmenistan"
        ]
    },
    {
        "id": "tr",
        "name": "Turquie",
        "continent": "Asie",
        "alt": [
            "turkey",
            "turkiye"
        ]
    },
    {
        "id": "vn",
        "name": "Vietnam",
        "continent": "Asie"
    },
    {
        "id": "ye",
        "name": "Yémen",
        "continent": "Asie",
        "alt": [
            "yemen"
        ]
    },
    {
        "id": "ag",
        "name": "Antigua-et-Barbuda",
        "continent": "Amérique",
        "alt": [
            "antigua",
            "antigua-et-barbuda",
            "antigua et barbuda"
        ]
    },
    {
        "id": "ar",
        "name": "Argentine",
        "continent": "Amérique",
        "alt": [
            "argentina"
        ]
    },
    {
        "id": "bs",
        "name": "Bahamas",
        "continent": "Amérique"
    },
    {
        "id": "bb",
        "name": "Barbade",
        "continent": "Amérique",
        "alt": [
            "barbados"
        ]
    },
    {
        "id": "bz",
        "name": "Belize",
        "continent": "Amérique"
    },
    {
        "id": "bo",
        "name": "Bolivie",
        "continent": "Amérique",
        "alt": [
            "bolivia"
        ]
    },
    {
        "id": "br",
        "name": "Brésil",
        "continent": "Amérique",
        "alt": [
            "bresil",
            "brazil"
        ]
    },
    {
        "id": "ca",
        "name": "Canada",
        "continent": "Amérique"
    },
    {
        "id": "cl",
        "name": "Chili",
        "continent": "Amérique",
        "alt": [
            "chile"
        ]
    },
    {
        "id": "co",
        "name": "Colombie",
        "continent": "Amérique",
        "alt": [
            "colombia"
        ]
    },
    {
        "id": "cr",
        "name": "Costa Rica",
        "continent": "Amérique",
        "alt": [
            "costarica",
            "costa rica"
        ]
    },
    {
        "id": "cu",
        "name": "Cuba",
        "continent": "Amérique"
    },
    {
        "id": "do",
        "name": "République Dominicaine",
        "continent": "Amérique",
        "alt": [
            "dominican republic",
            "rep dom",
            "republique dominicaine"
        ]
    },
    {
        "id": "dm",
        "name": "Dominique",
        "continent": "Amérique",
        "alt": [
            "dominica"
        ]
    },
    {
        "id": "ec",
        "name": "Équateur",
        "continent": "Amérique",
        "alt": [
            "ecuador"
        ]
    },
    {
        "id": "us",
        "name": "États-Unis",
        "continent": "Amérique",
        "alt": [
            "usa",
            "amerique",
            "etats-unis",
            "etats unis",
            "etatsunis",
            "united states",
            "us"
        ]
    },
    {
        "id": "gd",
        "name": "Grenade",
        "continent": "Amérique",
        "alt": [
            "grenada"
        ]
    },
    {
        "id": "gt",
        "name": "Guatemala",
        "continent": "Amérique"
    },
    {
        "id": "gy",
        "name": "Guyana",
        "continent": "Amérique"
    },
    {
        "id": "ht",
        "name": "Haïti",
        "continent": "Amérique",
        "alt": [
            "haiti"
        ]
    },
    {
        "id": "hn",
        "name": "Honduras",
        "continent": "Amérique"
    },
    {
        "id": "jm",
        "name": "Jamaïque",
        "continent": "Amérique",
        "alt": [
            "jamaica"
        ]
    },
    {
        "id": "mx",
        "name": "Mexique",
        "continent": "Amérique",
        "alt": [
            "mexique",
            "mexico"
        ]
    },
    {
        "id": "ni",
        "name": "Nicaragua",
        "continent": "Amérique"
    },
    {
        "id": "pa",
        "name": "Panama",
        "continent": "Amérique"
    },
    {
        "id": "py",
        "name": "Paraguay",
        "continent": "Amérique"
    },
    {
        "id": "pe",
        "name": "Pérou",
        "continent": "Amérique",
        "alt": [
            "peru"
        ]
    },
    {
        "id": "kn",
        "name": "Saint-Kitts-et-Nevis",
        "continent": "Amérique",
        "alt": [
            "saint kitts",
            "saint-kitts",
            "st kitts",
            "saint christophe et nieves"
        ]
    },
    {
        "id": "vc",
        "name": "Saint-Vincent-et-les-Grenadines",
        "continent": "Amérique",
        "alt": [
            "saint vincent",
            "saint-vincent",
            "st vincent"
        ]
    },
    {
        "id": "lc",
        "name": "Sainte-Lucie",
        "continent": "Amérique",
        "alt": [
            "sainte lucie",
            "saint lucia",
            "sainte-lucie"
        ]
    },
    {
        "id": "sv",
        "name": "Salvador",
        "continent": "Amérique",
        "alt": [
            "el salvador",
            "salvador"
        ]
    },
    {
        "id": "sr",
        "name": "Suriname",
        "continent": "Amérique"
    },
    {
        "id": "tt",
        "name": "Trinité-et-Tobago",
        "continent": "Amérique",
        "alt": [
            "trinite",
            "trinidad",
            "trinite-et-tobago",
            "trinite et tobago"
        ]
    },
    {
        "id": "uy",
        "name": "Uruguay",
        "continent": "Amérique"
    },
    {
        "id": "ve",
        "name": "Venezuela",
        "continent": "Amérique",
        "alt": [
            "venezuela"
        ]
    },
    {
        "id": "au",
        "name": "Australie",
        "continent": "Océanie",
        "alt": [
            "australia"
        ]
    },
    {
        "id": "fj",
        "name": "Fidji",
        "continent": "Océanie",
        "alt": [
            "fiji"
        ]
    },
    {
        "id": "ki",
        "name": "Kiribati",
        "continent": "Océanie"
    },
    {
        "id": "mh",
        "name": "Îles Marshall",
        "continent": "Océanie",
        "alt": [
            "marshall",
            "iles marshall"
        ]
    },
    {
        "id": "fm",
        "name": "Micronésie",
        "continent": "Océanie",
        "alt": [
            "micronesia",
            "micronesie"
        ]
    },
    {
        "id": "nr",
        "name": "Nauru",
        "continent": "Océanie"
    },
    {
        "id": "nz",
        "name": "Nouvelle-Zélande",
        "continent": "Océanie",
        "alt": [
            "nouvelle-zelande",
            "nouvelle zelande",
            "nz",
            "new zealand"
        ]
    },
    {
        "id": "pw",
        "name": "Palaos",
        "continent": "Océanie",
        "alt": [
            "palau"
        ]
    },
    {
        "id": "pg",
        "name": "Papouasie-Nouvelle-Guinée",
        "continent": "Océanie",
        "alt": [
            "png",
            "papouasie-nouvelle-guinee",
            "papouasie nouvelle guinee",
            "papouasie"
        ]
    },
    {
        "id": "sb",
        "name": "Îles Salomon",
        "continent": "Océanie",
        "alt": [
            "solomon islands",
            "iles salomon",
            "salomon"
        ]
    },
    {
        "id": "ws",
        "name": "Samoa",
        "continent": "Océanie"
    },
    {
        "id": "to",
        "name": "Tonga",
        "continent": "Océanie"
    },
    {
        "id": "tv",
        "name": "Tuvalu",
        "continent": "Océanie"
    },
    {
        "id": "vu",
        "name": "Vanuatu",
        "continent": "Océanie"
    }
];

// Utilisable à la fois dans le navigateur (window.allCountries) et côté serveur (require)
if (typeof window !== 'undefined') window.allCountries = allCountries;
if (typeof module !== 'undefined' && module.exports) module.exports = allCountries;
