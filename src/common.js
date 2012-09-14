var countryCodes={"Canada": "CA", "Guinea-Bissau": "GW", "Congo, The Democratic Republic Of The": "CD", "Iran, Islamic Republic Of": "IR", "Cambodia": "KH", "Switzerland": "CH", "Ethiopia": "ET", "Aruba": "AW", "Swaziland": "SZ", "Argentina": "AR", "Cameroon": "CM", "Burkina Faso": "BF", "Turkmenistan": "TM", "Ghana": "GH", "Saudi Arabia": "SA", "Rwanda": "RW", "Martinique": "MQ", "Togo": "TG", "Bolivia, Plurinational State Of": "BO", "Venezuela, Bolivarian Republic Of": "VE", "Japan": "JP", "American Samoa": "AS", "United States Minor Outlying Islands": "UM", "Cocos (Keeling) Islands": "CC", "Pitcairn": "PN", "Guatemala": "GT", "Kuwait": "KW", "Russia": "RU", "Jordan": "JO", "Virgin Islands, British": "VG", "Dominica": "DM", "Liberia": "LR", "Maldives": "MV", "Jamaica": "JM", "Lithuania": "LT", "Korea, Democratic People'S Republic Of": "KP", "Saint Kitts And Nevis": "KN", "Svalbard And Jan Mayen": "SJ", "Christmas Island": "CX", "French Guiana": "GF", "Niue": "NU", "Monaco": "MC", "Samoa": "WS", "New Zealand": "NZ", "Saint Helena, Ascension And Tristan Da Cunha": "SH", "Jersey": "JE", "Andorra": "AD", "Yemen": "YE", "Albania": "AL", "Lao People'S Democratic Republic": "LA", "Norfolk Island": "NF", "United Arab Emirates": "AE", "Guam": "GU", "India": "IN", "Azerbaijan": "AZ", "Lesotho": "LS", "Saint Vincent And The Grenadines": "VC", "Kenya": "KE", "Macao": "MO", "Greenland": "GL", "Turkey": "TR", "Afghanistan": "AF", "South Georgia And The South Sandwich Islands": "GS", "Bangladesh": "BD", "Mauritania": "MR", "Solomon Islands": "SB", "Viet Nam": "VN", "Saint Lucia": "LC", "San Marino": "SM", "French Polynesia": "PF", "France": "FR", "Western Sahara": "EH", "Syrian Arab Republic": "SY", "Bermuda": "BM", "Slovakia": "SK", "Somalia": "SO", "Peru": "PE", "Vanuatu": "VU", "Nauru": "NR", "Seychelles": "SC", "Norway": "NO", "Malawi": "MW", "Cook Islands": "CK", "Benin": "BJ", "Wallis And Futuna": "WF", "Cuba": "CU", "Cura\u00c7Ao": "CW", "Montenegro": "ME", "Falkland Islands (Malvinas)": "FK", "Mayotte": "YT", "Holy See (Vatican City State)": "VA", "China": "CN", "Armenia": "AM", "Dominican Republic": "DO", "Moldova, Republic Of": "MD", "Ukraine": "UA", "Bahrain": "BH", "Tonga": "TO", "Finland": "FI", "Libya": "LY", "Cayman Islands": "KY", "Central African Republic": "CF", "New Caledonia": "NC", "Mauritius": "MU", "Tajikistan": "TJ", "Liechtenstein": "LI", "Belarus": "BY", "Antigua And Barbuda": "AG", "\u00c5Land Islands": "AX", "Sweden": "SE", "Bulgaria": "BG", "Virgin Islands, U.S.": "VI", "United States": "US", "Romania": "RO", "Angola": "AO", "French Southern Territories": "TF", "Chad": "TD", "South Africa": "ZA", "Tokelau": "TK", "Cyprus": "CY", "Brunei Darussalam": "BN", "Qatar": "QA", "Malaysia": "MY", "Austria": "AT", "Mozambique": "MZ", "Uganda": "UG", "Hungary": "HU", "Niger": "NE", "South Sudan": "SS", "Brazil": "BR", "Turks And Caicos Islands": "TC", "Tanzania, United Republic Of": "TZ", "Faroe Islands": "FO", "Guinea": "GN", "Panama": "PA", "Mali": "ML", "Zambia": "ZM", "Costa Rica": "CR", "Luxembourg": "LU", "Cape Verde": "CV", "Bahamas": "BS", "Gibraltar": "GI", "Ireland": "IE", "Pakistan": "PK", "Palau": "PW", "Nigeria": "NG", "Bonaire, Sint Eustatius And Saba": "BQ", "Ecuador": "EC", "Czech Republic": "CZ", "Australia": "AU", "Algeria": "DZ", "Slovenia": "SI", "El Salvador": "SV", "Tuvalu": "TV", "Heard Island And Mcdonald Islands": "HM", "Marshall Islands": "MH", "Chile": "CL", "Puerto Rico": "PR", "Belgium": "BE", "Kiribati": "KI", "Haiti": "HT", "Belize": "BZ", "Hong Kong": "HK", "Sierra Leone": "SL", "Georgia": "GE", "Oman": "OM", "Gambia": "GM", "Philippines": "PH", "Sao Tome And Principe": "ST", "Morocco": "MA", "Croatia": "HR", "Mongolia": "MN", "Guernsey": "GG", "Thailand": "TH", "Namibia": "NA", "Grenada": "GD", "Iraq": "IQ", "Portugal": "PT", "Estonia": "EE", "Uruguay": "UY", "Saint Pierre And Miquelon": "PM", "Equatorial Guinea": "GQ", "Lebanon": "LB", "Uzbekistan": "UZ", "Tunisia": "TN", "Djibouti": "DJ", "Country Name": "ISO 3166-1-alpha-2 code", "Timor-Leste": "TL", "Spain": "ES", "Colombia": "CO", "Burundi": "BI", "Fiji": "FJ", "Northern Mariana Islands": "MP", "Barbados": "BB", "Madagascar": "MG", "Isle Of Man": "IM", "Italy": "IT", "Bhutan": "BT", "Sudan": "SD", "C\u00d4Te D'Ivoire": "CI", "Nepal": "NP", "Malta": "MT", "Netherlands": "NL", "Bosnia And Herzegovina": "BA", "Suriname": "SR", "Anguilla": "AI", "United Kingdom": "GB", "Israel": "IL", "Indonesia": "ID", "Iceland": "IS", "Saint Barth\u00c9Lemy": "BL", "Korea, Republic Of": "KR", "Senegal": "SN", "Papua New Guinea": "PG", 
"Taiwan R.O.C.": "TW", "Zimbabwe": "ZW", "Germany": "DE", "Denmark": "DK", "Kazakhstan": "KZ", "Poland": "PL", "Eritrea": "ER", "Kyrgyzstan": "KG", "British Indian Ocean Territory": "IO", "Montserrat": "MS", "Mexico": "MX", "Sri Lanka": "LK", "Latvia": "LV", "Sint Maarten (Dutch Part)": "SX", "Guyana": "GY", "Guadeloupe": "GP", "Micronesia, Federated States Of": "FM", "Saint Martin (French Part)": "MF", "R\u00c9Union": "RE", "Honduras": "HN", "Myanmar": "MM", "Bouvet Island": "BV", "Egypt": "EG", "Nicaragua": "NI", "Singapore": "SG", "Serbia": "RS", "Botswana": "BW", "Macedonia, The Former Yugoslav Republic Of": "MK", "Trinidad And Tobago": "TT", "Antarctica": "AQ", "Congo": "CG", "Greece": "GR", "Paraguay": "PY", "Gabon": "GA", "Palestinian Territory, Occupied": "PS", "Comoros": "KM"}

function barplots(el,series,options) {
  // barplots the series. where series is [{label: "foo",value: 30},] 
  function get_max(s) {
    var r=0;
    _.each(s, function(v) {
      if (v.value>r) {
        r=v.value;
        }
      });
    return r; 
    }
  
  options = options || {};
  options.width = options.width || el.width();
  options.log = options.log || false;
  options.min = options.min || 0;
  if (options.log) {
    options.max = options.max || Math.log(get_max(series));
    }
  else {  
    options.max = options.max || get_max(series);
    }
  options.colorscale = options.colorscale || new chroma.ColorScale ({colors:
    chroma.brewer.Blues,
    limits: [options.min,options.max]
    });
  options.barwidth = options.barwidth || options.width/2;
  options.labelwidth = options.labelwidth || options.width/2;
  var html=["<table><tbody>"];
  _.each(series, function(record) {
    if (options.log) {
      var width=Math.log(record.value)/options.max*100;
      }
    else {  
      var width=(record.value-options.min)/(options.max-options.min)*100;
      }
    width = width>=0? width:0;

    html.push("<tr id='bp-",idfy(record.label)
    ,"'><td width='"+options.labelwidth+
    "px' class='bplabel'>",record.label,"</td><td width='"+
    options.barwidth+"px' class='bpvalue'><div style='width: "+width+
    "%; background: "+options.colorscale.getColor(options.log?Math.log(record.value):record.value)+
    "'>",record.value,"</div></td></tr>")
    });
  html.push("</tbody></table>");  
  el.html(html.join(""));
  }

function idfy(str) {
  return str.replace(/ /g,"-");
  }
