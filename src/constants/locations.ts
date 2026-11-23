
export interface BDLocation {
  id: string;
  name: string;
  bn_name?: string;
}

export interface BDDistrict extends BDLocation {
  division_id: string;
}

export interface BDUpazila extends BDLocation {
  district_id: string;
}

export const DIVISIONS: BDLocation[] = [
  { id: '1', name: 'Barishal', bn_name: 'বরিশাল' },
  { id: '2', name: 'Chattogram', bn_name: 'চট্টগ্রাম' },
  { id: '3', name: 'Dhaka', bn_name: 'ঢাকা' },
  { id: '4', name: 'Khulna', bn_name: 'খুলনা' },
  { id: '5', name: 'Rajshahi', bn_name: 'রাজশাহী' },
  { id: '6', name: 'Rangpur', bn_name: 'রংপুর' },
  { id: '7', name: 'Sylhet', bn_name: 'সিলেট' },
  { id: '8', name: 'Mymensingh', bn_name: 'ময়মনসিংহ' }
];

export const DISTRICTS: Record<string, BDLocation[]> = {
  '1': [
    { id: '1', name: 'Barishal', bn_name: 'বরিশাল' },
    { id: '2', name: 'Barguna', bn_name: 'বরগুনা' },
    { id: '3', name: 'Bhola', bn_name: 'ভোলা' },
    { id: '4', name: 'Jhalakathi', bn_name: 'ঝালকাঠি' },
    { id: '5', name: 'Patuakhali', bn_name: 'পটুয়াখালী' },
    { id: '6', name: 'Pirojpur', bn_name: 'পিরোজপুর' }
  ],
  '2': [
    { id: '7', name: 'Chattogram', bn_name: 'চট্টগ্রাম' },
    { id: '8', name: 'Cox\'s Bazar', bn_name: 'কক্সবাজার' },
    { id: '9', name: 'Cumilla', bn_name: 'কুমিল্লা' },
    { id: '10', name: 'Feni', bn_name: 'ফেনী' },
    { id: '11', name: 'Brahmanbaria', bn_name: 'ব্রাহ্মণবাড়িয়া' },
    { id: '12', name: 'Rangamati', bn_name: 'রাঙ্গামাটি' },
    { id: '13', name: 'Noakhali', bn_name: 'নোয়াখালী' },
    { id: '14', name: 'Chandpur', bn_name: 'চাঁদপুর' },
    { id: '15', name: 'Lakshmipur', bn_name: 'লক্ষ্মীপুর' },
    { id: '16', name: 'Khagrachhari', bn_name: 'খাগড়াছড়ি' },
    { id: '17', name: 'Bandarban', bn_name: 'বান্দরবান' }
  ],
  '3': [
    { id: '18', name: 'Dhaka', bn_name: 'ঢাকা' },
    { id: '19', name: 'Gazipur', bn_name: 'গাজীপুর' },
    { id: '20', name: 'Narayanganj', bn_name: 'নারায়ণগঞ্জ' },
    { id: '21', name: 'Manikganj', bn_name: 'মানিকগঞ্জ' },
    { id: '22', name: 'Munshiganj', bn_name: 'মুন্সিগঞ্জ' },
    { id: '23', name: 'Narsingdi', bn_name: 'নরসিংদী' },
    { id: '24', name: 'Tangail', bn_name: 'টাঙ্গাইল' },
    { id: '25', name: 'Kishoreganj', bn_name: 'কিশোরগঞ্জ' },
    { id: '26', name: 'Rajbari', bn_name: 'রাজবাড়ী' },
    { id: '27', name: 'Gopalganj', bn_name: 'গোপালগঞ্জ' },
    { id: '28', name: 'Faridpur', bn_name: 'ফরিদপুর' },
    { id: '29', name: 'Madaripur', bn_name: 'মাদারীপুর' },
    { id: '30', name: 'Shariatpur', bn_name: 'শরীয়তপুর' }
  ],
  '4': [
    { id: '31', name: 'Khulna', bn_name: 'খুলনা' },
    { id: '32', name: 'Bagerhat', bn_name: 'বাগেরহাট' },
    { id: '33', name: 'Chuadanga', bn_name: 'চুয়াডাঙ্গা' },
    { id: '34', name: 'Jashore', bn_name: 'যশোর' },
    { id: '35', name: 'Jhenaidah', bn_name: 'ঝিনাইদহ' },
    { id: '36', name: 'Kushtia', bn_name: 'কুষ্টিয়া' },
    { id: '37', name: 'Magura', bn_name: 'মাগুরা' },
    { id: '38', name: 'Meherpur', bn_name: 'মেহেরপুর' },
    { id: '39', name: 'Narail', bn_name: 'নড়াইল' },
    { id: '40', name: 'Satkhira', bn_name: 'সাতক্ষীরা' }
  ],
  '5': [
    { id: '41', name: 'Rajshahi', bn_name: 'রাজশাহী' },
    { id: '42', name: 'Bogura', bn_name: 'বগুড়া' },
    { id: '43', name: 'Joypurhat', bn_name: 'জয়পুরহাট' },
    { id: '44', name: 'Naogaon', bn_name: 'নওগাঁ' },
    { id: '45', name: 'Natore', bn_name: 'নাটোর' },
    { id: '46', name: 'Pabna', bn_name: 'পাবনা' },
    { id: '47', name: 'Sirajganj', bn_name: 'সিরাজগঞ্জ' },
    { id: '48', name: 'Chapai Nawabganj', bn_name: 'চাঁপাইনবাবগঞ্জ' }
  ],
  '6': [
    { id: '49', name: 'Rangpur', bn_name: 'রংপুর' },
    { id: '50', name: 'Dinajpur', bn_name: 'দিনাজপুর' },
    { id: '51', name: 'Gaibandha', bn_name: 'গাইবান্ধা' },
    { id: '52', name: 'Kurigram', bn_name: 'কুড়িগ্রাম' },
    { id: '53', name: 'Lalmonirhat', bn_name: 'লালমনিরহাট' },
    { id: '54', name: 'Nilphamari', bn_name: 'নীলফামারী' },
    { id: '55', name: 'Panchagarh', bn_name: 'পঞ্চগড়' },
    { id: '56', name: 'Thakurgaon', bn_name: 'ঠাকুরগাঁও' }
  ],
  '7': [
    { id: '57', name: 'Sylhet', bn_name: 'সিলেট' },
    { id: '58', name: 'Habiganj', bn_name: 'হবিগঞ্জ' },
    { id: '59', name: 'Moulvibazar', bn_name: 'মৌলভীবাজার' },
    { id: '60', name: 'Sunamganj', bn_name: 'সুনামগঞ্জ' }
  ],
  '8': [
    { id: '61', name: 'Mymensingh', bn_name: 'ময়মনসিংহ' },
    { id: '62', name: 'Jamalpur', bn_name: 'জামালপুর' },
    { id: '63', name: 'Netrokona', bn_name: 'নেত্রকোণা' },
    { id: '64', name: 'Sherpur', bn_name: 'শেরপুর' }
  ]
};

export const UPAZILAS: Record<string, BDLocation[]> = {
  // Barishal Division
  '1': [
    { id: '1', name: 'Barishal Sadar', bn_name: 'বরিশাল সদর' },
    { id: '2', name: 'Bakerganj', bn_name: 'বাকেরগঞ্জ' },
    { id: '3', name: 'Banaripara', bn_name: 'বানারীপাড়া' },
    { id: '4', name: 'Gaurnadi', bn_name: 'গৌরনদী' },
    { id: '5', name: 'Hizla', bn_name: 'হিজলা' },
    { id: '6', name: 'Mehendiganj', bn_name: 'মেহেন্দিগঞ্জ' },
    { id: '7', name: 'Babuganj', bn_name: 'বাবুগঞ্জ' },
    { id: '8', name: 'Muladi', bn_name: 'মুলাদী' },
    { id: '9', name: 'Wazirpur', bn_name: 'উজিরপুর' },
    { id: '10', name: 'Agailjhara', bn_name: 'আগৈলঝাড়া' }
  ],
  '2': [
    { id: '11', name: 'Barguna Sadar', bn_name: 'বরগুনা সদর' },
    { id: '12', name: 'Amtali', bn_name: 'আমতলী' },
    { id: '13', name: 'Betagi', bn_name: 'বেতাগী' },
    { id: '14', name: 'Bamna', bn_name: 'বামনা' },
    { id: '15', name: 'Patharghata', bn_name: 'পাথরঘাটা' },
    { id: '16', name: 'Taltali', bn_name: 'তালতলী' }
  ],
  '3': [
    { id: '17', name: 'Bhola Sadar', bn_name: 'ভোলা সদর' },
    { id: '18', name: 'Burhanuddin', bn_name: 'বোরহানউদ্দিন' },
    { id: '19', name: 'Char Fasson', bn_name: 'চরফ্যাসন' },
    { id: '20', name: 'Daulatkhan', bn_name: 'দৌলতখান' },
    { id: '21', name: 'Lalmohan', bn_name: 'লালমোহন' },
    { id: '22', name: 'Manpura', bn_name: 'মনপুরা' },
    { id: '23', name: 'Tazumuddin', bn_name: 'তজুমদ্দিন' }
  ],
  '4': [
    { id: '24', name: 'Jhalakathi Sadar', bn_name: 'ঝালকাঠি সদর' },
    { id: '25', name: 'Kathalia', bn_name: 'কাঠালিয়া' },
    { id: '26', name: 'Nalchity', bn_name: 'নলছিটি' },
    { id: '27', name: 'Rajapur', bn_name: 'রাজাপুর' }
  ],
  '5': [
    { id: '28', name: 'Patuakhali Sadar', bn_name: 'পটুয়াখালী সদর' },
    { id: '29', name: 'Bauphal', bn_name: 'বাউফল' },
    { id: '30', name: 'Dashmina', bn_name: 'দশমিনা' },
    { id: '31', name: 'Galachipa', bn_name: 'গলাচিপা' },
    { id: '32', name: 'Kalapara', bn_name: 'কলাপাড়া' },
    { id: '33', name: 'Mirzaganj', bn_name: 'মির্জাগঞ্জ' },
    { id: '34', name: 'Rangabali', bn_name: 'রঙ্গাবালী' },
    { id: '35', name: 'Dumki', bn_name: 'দুমকী' }
  ],
  '6': [
    { id: '36', name: 'Pirojpur Sadar', bn_name: 'পিরোজপুর সদর' },
    { id: '37', name: 'Bhandaria', bn_name: 'ভাণ্ডারিয়া' },
    { id: '38', name: 'Kawkhali', bn_name: 'কাউখালী' },
    { id: '39', name: 'Mathbaria', bn_name: 'মঠবাড়িয়া' },
    { id: '40', name: 'Nazirpur', bn_name: 'নাজিরপুর' },
    { id: '41', name: 'Nesarabad (Swarupkati)', bn_name: 'নেছারাবাদ' },
    { id: '42', name: 'Zianagar', bn_name: 'জিয়ানগর' }
  ],

  // Chattogram Division
  '7': [
    { id: '43', name: 'Anwara', bn_name: 'আনোয়ারা' },
    { id: '44', name: 'Banshkhali', bn_name: 'বাঁশখালী' },
    { id: '45', name: 'Boalkhali', bn_name: 'বোয়ালখালী' },
    { id: '46', name: 'Chandanaish', bn_name: 'চন্দনাইশ' },
    { id: '47', name: 'Fatikchhari', bn_name: 'ফটিকছড়ি' },
    { id: '48', name: 'Hathazari', bn_name: 'হাটহাজারী' },
    { id: '49', name: 'Lohagara', bn_name: 'লোহাগাড়া' },
    { id: '50', name: 'Mirsharai', bn_name: 'মীরসরাই' },
    { id: '51', name: 'Patiya', bn_name: 'পটিয়া' },
    { id: '52', name: 'Rangunia', bn_name: 'রাঙ্গুনিয়া' },
    { id: '53', name: 'Raozan', bn_name: 'রাউজান' },
    { id: '54', name: 'Sandwip', bn_name: 'সন্দ্বীপ' },
    { id: '55', name: 'Satkania', bn_name: 'সাতকানিয়া' },
    { id: '56', name: 'Sitakunda', bn_name: 'সীতাকুণ্ড' },
    { id: '57', name: 'Chattogram Sadar', bn_name: 'চট্টগ্রাম সদর' },
    { id: '58', name: 'Karnaphuli', bn_name: 'কর্ণফুলী' }
  ],
  '8': [
    { id: '59', name: 'Cox\'s Bazar Sadar', bn_name: 'কক্সবাজার সদর' },
    { id: '60', name: 'Chakaria', bn_name: 'চকোরিয়া' },
    { id: '61', name: 'Kutubdia', bn_name: 'কুতুবদিয়া' },
    { id: '62', name: 'Maheshkhali', bn_name: 'মহেশখালী' },
    { id: '63', name: 'Ramu', bn_name: 'রামু' },
    { id: '64', name: 'Teknaf', bn_name: 'টেকনাফ' },
    { id: '65', name: 'Ukhia', bn_name: 'উখিয়া' },
    { id: '66', name: 'Pekua', bn_name: 'পেকুয়া' }
  ],
  '9': [
    { id: '67', name: 'Cumilla Sadar', bn_name: 'কুমিল্লা সদর' },
    { id: '68', name: 'Barura', bn_name: 'বরুড়া' },
    { id: '69', name: 'Brahmanpara', bn_name: 'ব্রাহ্মণপাড়া' },
    { id: '70', name: 'Burichang', bn_name: 'বুড়িচং' },
    { id: '71', name: 'Chandina', bn_name: 'চান্দিনা' },
    { id: '72', name: 'Chauddagram', bn_name: 'চৌদ্দগ্রাম' },
    { id: '73', name: 'Daudkandi', bn_name: 'দাউদকান্দি' },
    { id: '74', name: 'Debidwar', bn_name: 'দেবিদ্বার' },
    { id: '75', name: 'Homna', bn_name: 'হোমনা' },
    { id: '76', name: 'Laksam', bn_name: 'লাকসাম' },
    { id: '77', name: 'Muradnagar', bn_name: 'মুরাদনগর' },
    { id: '78', name: 'Nangalkot', bn_name: 'নাঙ্গলকোট' },
    { id: '79', name: 'Titas', bn_name: 'তিতাস' },
    { id: '80', name: 'Meghna', bn_name: 'মেঘনা' },
    { id: '81', name: 'Monohargonj', bn_name: 'মনোহরগঞ্জ' },
    { id: '82', name: 'Sadar South', bn_name: 'সদর দক্ষিণ' }
  ],
  '10': [
    { id: '83', name: 'Feni Sadar', bn_name: 'ফেনী সদর' },
    { id: '84', name: 'Chhagalnaiya', bn_name: 'ছাগলনাইয়া' },
    { id: '85', name: 'Daganbhuiyan', bn_name: 'দাগনভূঞা' },
    { id: '86', name: 'Parshuram', bn_name: 'পরশুরাম' },
    { id: '87', name: 'Sonagazi', bn_name: 'সোনাগাজী' },
    { id: '88', name: 'Fulgazi', bn_name: 'ফুলগাজী' }
  ],
  '11': [
    { id: '89', name: 'Brahmanbaria Sadar', bn_name: 'ব্রাহ্মণবাড়িয়া সদর' },
    { id: '90', name: 'Ashuganj', bn_name: 'আশুগঞ্জ' },
    { id: '91', name: 'Bancharampur', bn_name: 'বাঞ্ছারামপুর' },
    { id: '92', name: 'Kasba', bn_name: 'কসবা' },
    { id: '110', name: 'Nabinagar', bn_name: 'নবীনগর' },
    { id: '111', name: 'Nasirnagar', bn_name: 'নাসিরনগর' },
    { id: '112', name: 'Sarail', bn_name: 'সরাইল' },
    { id: '113', name: 'Bijoynagar', bn_name: 'বিজয়নগর' }
  ],
  '12': [
    { id: '114', name: 'Rangamati Sadar', bn_name: 'রাঙ্গামাটি সদর' },
    { id: '115', name: 'Bagaichhari', bn_name: 'বাঘাইছড়ি' },
    { id: '116', name: 'Barkal', bn_name: 'বরকল' },
    { id: '117', name: 'Kawkhali', bn_name: 'কাউখালী' },
    { id: '118', name: 'Belaichhari', bn_name: 'বিলাইছড়ি' },
    { id: '119', name: 'Kaptai', bn_name: 'কাপ্তাই' },
    { id: '120', name: 'Jurachhari', bn_name: 'জুরাছড়ি' },
    { id: '121', name: 'Langadu', bn_name: 'লংগদু' },
    { id: '122', name: 'Naniyarchar', bn_name: 'নানিয়ারচর' },
    { id: '123', name: 'Rajasthali', bn_name: 'রাজস্থলী' }
  ],
  '13': [
    { id: '124', name: 'Noakhali Sadar', bn_name: 'নোয়াখালী সদর' },
    { id: '125', name: 'Begumganj', bn_name: 'বেগমগঞ্জ' },
    { id: '126', name: 'Chatkhil', bn_name: 'চাটখিল' },
    { id: '127', name: 'Companyganj', bn_name: 'কোম্পানীগঞ্জ' },
    { id: '128', name: 'Hatiya', bn_name: 'হাতিয়া' },
    { id: '129', name: 'Senbagh', bn_name: 'সেনবাগ' },
    { id: '130', name: 'Sonaimuri', bn_name: 'সোনাইমুড়ী' },
    { id: '131', name: 'Subarnachar', bn_name: 'সুবর্ণচর' },
    { id: '132', name: 'Kabirhat', bn_name: 'কবিরহাট' }
  ],
  '14': [
    { id: '133', name: 'Chandpur Sadar', bn_name: 'চাঁদপুর সদর' },
    { id: '134', name: 'Faridganj', bn_name: 'ফরিদগঞ্জ' },
    { id: '135', name: 'Haimchar', bn_name: 'হাইমচর' },
    { id: '136', name: 'Haziganj', bn_name: 'হাজীগঞ্জ' },
    { id: '137', name: 'Kachua', bn_name: 'কচুয়া' },
    { id: '138', name: 'Matlab North', bn_name: 'মতলব উত্তর' },
    { id: '139', name: 'Matlab South', bn_name: 'মতলব দক্ষিণ' },
    { id: '140', name: 'Shahrasti', bn_name: 'শাহরাস্তি' }
  ],
  '15': [
    { id: '141', name: 'Lakshmipur Sadar', bn_name: 'লক্ষ্মীপুর সদর' },
    { id: '142', name: 'Raipur', bn_name: 'রায়পুর' },
    { id: '143', name: 'Ramganj', bn_name: 'রামগঞ্জ' },
    { id: '144', name: 'Ramgati', bn_name: ' রামগতি' },
    { id: '145', name: 'Kamalnagar', bn_name: 'কমলনগর' }
  ],
  '16': [
    { id: '146', name: 'Khagrachhari Sadar', bn_name: 'খাগড়াছড়ি সদর' },
    { id: '147', name: 'Dighinala', bn_name: 'দীঘিনালা' },
    { id: '148', name: 'Lakshmichhari', bn_name: 'লক্ষ্মীছড়ি' },
    { id: '149', name: 'Mahalchhari', bn_name: 'মহালছড়ি' },
    { id: '150', name: 'Manikchhari', bn_name: 'মানিকছড়ি' },
    { id: '151', name: 'Matiranga', bn_name: 'মাটিরাঙ্গা' },
    { id: '152', name: 'Panchhari', bn_name: 'পানছড়ি' },
    { id: '153', name: 'Ramgarh', bn_name: 'রামগড়' }
  ],
  '17': [
    { id: '154', name: 'Bandarban Sadar', bn_name: 'বান্দরবান সদর' },
    { id: '155', name: 'Alikadam', bn_name: 'আলীকদম' },
    { id: '156', name: 'Lama', bn_name: 'লামা' },
    { id: '157', name: 'Naikhongchhari', bn_name: 'নাইক্ষ্যংছড়ি' },
    { id: '158', name: 'Rowangchhari', bn_name: 'রোয়াংছড়ি' },
    { id: '159', name: 'Ruma', bn_name: 'রুমা' },
    { id: '160', name: 'Thanchi', bn_name: 'থানচি' }
  ],

  // Dhaka Division
  '18': [
    { id: '161', name: 'Dhamrai', bn_name: 'ধামরাই' },
    { id: '162', name: 'Dohar', bn_name: 'দোহার' },
    { id: '163', name: 'Keraniganj', bn_name: 'কেরানীগঞ্জ' },
    { id: '164', name: 'Nawabganj', bn_name: 'নবাবগঞ্জ' },
    { id: '165', name: 'Savar', bn_name: 'সাভার' },
    { id: '166', name: 'Adabor', bn_name: 'আদাবর' },
    { id: '167', name: 'Badda', bn_name: 'বাড্ডা' },
    { id: '168', name: 'Bangshal', bn_name: 'বংশাল' },
    { id: '169', name: 'Bimanbandar', bn_name: 'বিমানবন্দর' },
    { id: '170', name: 'Cantonment', bn_name: 'ক্যান্টনমেন্ট' },
    { id: '171', name: 'Chak Bazar', bn_name: 'চকবাজার' },
    { id: '172', name: 'Dakshinkhan', bn_name: 'দক্ষিণখান' },
    { id: '173', name: 'Darus Salam', bn_name: 'দারুসসালাম' },
    { id: '174', name: 'Demra', bn_name: 'ডেমরা' },
    { id: '175', name: 'Dhanmondi', bn_name: 'ধানমন্ডি' },
    { id: '176', name: 'Gendaria', bn_name: 'গেন্ডারিয়া' },
    { id: '177', name: 'Gulshan', bn_name: 'গুলশান' },
    { id: '178', name: 'Hazaribagh', bn_name: 'হাজারীবাগ' },
    { id: '179', name: 'Jatrabari', bn_name: 'যাত্রাবাড়ী' },
    { id: '180', name: 'Kadamtali', bn_name: 'কদমতলী' },
    { id: '181', name: 'Kafrul', bn_name: 'কাফরুল' },
    { id: '182', name: 'Kalabagan', bn_name: 'কলাবাগান' },
    { id: '183', name: 'Kamrangirchar', bn_name: 'কামরাঙ্গীরচর' },
    { id: '184', name: 'Khilgaon', bn_name: 'খিলগাঁও' },
    { id: '185', name: 'Khilkhet', bn_name: 'খিলক্ষেত' },
    { id: '186', name: 'Kotwali', bn_name: 'কোতয়ালী' },
    { id: '187', name: 'Lalbagh', bn_name: 'লালবাগ' },
    { id: '188', name: 'Mirpur', bn_name: 'মিরপুর' },
    { id: '189', name: 'Mohammadpur', bn_name: 'মোহাম্মদপুর' },
    { id: '190', name: 'Motijheel', bn_name: 'মতিঝিল' },
    { id: '191', name: 'New Market', bn_name: 'নিউ মার্কেট' },
    { id: '192', name: 'Pallabi', bn_name: 'পল্লবী' },
    { id: '193', name: 'Paltan', bn_name: 'পল্টন' },
    { id: '194', name: 'Ramna', bn_name: 'রমনা' },
    { id: '195', name: 'Rampura', bn_name: 'রামপুরা' },
    { id: '196', name: 'Sabujbagh', bn_name: 'সবুজবাগ' },
    { id: '197', name: 'Shah Ali', bn_name: 'শাহ আলী' },
    { id: '198', name: 'Shahbagh', bn_name: 'শাহবাগ' },
    { id: '199', name: 'Sher-e-Bangla Nagar', bn_name: 'শেরেবাংলা নগর' },
    { id: '200', name: 'Shyampur', bn_name: 'শ্যামপুর' },
    { id: '201', name: 'Sutrapur', bn_name: 'সূত্রাপুর' },
    { id: '202', name: 'Tejgaon', bn_name: 'তেজগাঁও' },
    { id: '203', name: 'Tejgaon Industrial Area', bn_name: 'তেজগাঁও শিল্পাঞ্চল' },
    { id: '204', name: 'Turag', bn_name: 'তুরাগ' },
    { id: '205', name: 'Uttar Khan', bn_name: 'উত্তরখান' },
    { id: '206', name: 'Uttara', bn_name: 'উত্তরা' },
    { id: '207', name: 'Vatara', bn_name: 'ভাটারা' }
  ],
  '19': [
    { id: '208', name: 'Gazipur Sadar', bn_name: 'গাজীপুর সদর' },
    { id: '209', name: 'Kaliakair', bn_name: 'কালিয়াকৈর' },
    { id: '210', name: 'Kaliganj', bn_name: 'কালীগঞ্জ' },
    { id: '211', name: 'Kapasia', bn_name: 'কাপাসিয়া' },
    { id: '212', name: 'Sreepur', bn_name: 'শ্রীপুর' }
  ],
  '20': [
    { id: '213', name: 'Araihazar', bn_name: 'আড়াইহাজার' },
    { id: '214', name: 'Bandar', bn_name: 'বন্দর' },
    { id: '215', name: 'Narayanganj Sadar', bn_name: 'নারায়ণগঞ্জ সদর' },
    { id: '216', name: 'Rupganj', bn_name: 'রূপগঞ্জ' },
    { id: '217', name: 'Sonargaon', bn_name: 'সোনারগাঁও' }
  ],
  '21': [
    { id: '218', name: 'Manikganj Sadar', bn_name: 'মানিকগঞ্জ সদর' },
    { id: '219', name: 'Singair', bn_name: 'সিংগাইর' },
    { id: '220', name: 'Shibalaya', bn_name: 'শিবালয়' },
    { id: '221', name: 'Saturia', bn_name: 'সাটুরিয়া' },
    { id: '222', name: 'Harirampur', bn_name: 'হরিরামপুর' },
    { id: '223', name: 'Ghior', bn_name: 'ঘিওড়' },
    { id: '224', name: 'Daulatpur', bn_name: 'দৌলতপুর' }
  ],
  '22': [
    { id: '225', name: 'Munshiganj Sadar', bn_name: 'মুন্সীগঞ্জ সদর' },
    { id: '226', name: 'Sreenagar', bn_name: 'শ্রীনগর' },
    { id: '227', name: 'Sirajdikhan', bn_name: 'সিরাজদিখান' },
    { id: '228', name: 'Lauhajang', bn_name: 'লৌহজং' },
    { id: '229', name: 'Gajaria', bn_name: 'গজারিয়া' },
    { id: '230', name: 'Tongibari', bn_name: 'টংগিবাড়ী' }
  ],
  '23': [
    { id: '231', name: 'Narsingdi Sadar', bn_name: 'নরসিংদী সদর' },
    { id: '232', name: 'Belabo', bn_name: 'বেলাবো' },
    { id: '233', name: 'Monohardi', bn_name: 'মনোহরদী' },
    { id: '234', name: 'Palash', bn_name: 'পলাশ' },
    { id: '235', name: 'Raipura', bn_name: 'রায়পুরা' },
    { id: '236', name: 'Shibpur', bn_name: 'শিবপুর' }
  ],
  '24': [
    { id: '237', name: 'Tangail Sadar', bn_name: 'টাঙ্গাইল সদর' },
    { id: '238', name: 'Basail', bn_name: 'বাসাইল' },
    { id: '239', name: 'Bhuapur', bn_name: 'ভূঞাপুর' },
    { id: '240', name: 'Delduar', bn_name: 'দেলদুয়ার' },
    { id: '241', name: 'Ghatail', bn_name: 'ঘাটাইল' },
    { id: '242', name: 'Gopalpur', bn_name: 'গোপালপুর' },
    { id: '243', name: 'Kalihati', bn_name: 'কালিহাতী' },
    { id: '244', name: 'Madhupur', bn_name: 'মধুপুর' },
    { id: '245', name: 'Mirzapur', bn_name: 'মির্জাপুর' },
    { id: '246', name: 'Nagarpur', bn_name: 'নাগরপুর' },
    { id: '247', name: 'Sakhipur', bn_name: 'সখিপুর' },
    { id: '248', name: 'Dhanbari', bn_name: 'ধনবাড়ী' }
  ],
  '25': [
    { id: '249', name: 'Kishoreganj Sadar', bn_name: 'কিশোরগঞ্জ সদর' },
    { id: '250', name: 'Austagram', bn_name: 'অষ্টগ্রাম' },
    { id: '251', name: 'Bajitpur', bn_name: 'বাজিতপুর' },
    { id: '252', name: 'Bhairab', bn_name: 'ভৈরব' },
    { id: '253', name: 'Hossainpur', bn_name: 'হোসেনপুর' },
    { id: '254', name: 'Itna', bn_name: 'ইটনা' },
    { id: '255', name: 'Karimganj', bn_name: 'করিমগঞ্জ' },
    { id: '256', name: 'Katiadi', bn_name: 'কটিয়াদী' },
    { id: '257', name: 'Kuliarchar', bn_name: 'কুলিয়ারচর' },
    { id: '258', name: 'Mithamain', bn_name: 'মিঠামইন' },
    { id: '259', name: 'Nikli', bn_name: 'নিকলী' },
    { id: '260', name: 'Pakundia', bn_name: 'পাকুন্দিয়া' },
    { id: '261', name: 'Tarail', bn_name: 'তাড়াইল' }
  ],
  '26': [
    { id: '262', name: 'Rajbari Sadar', bn_name: 'রাজবাড়ী সদর' },
    { id: '263', name: 'Baliakandi', bn_name: 'বালিয়াকান্দি' },
    { id: '264', name: 'Goalandaghat', bn_name: 'গোয়ালন্দ' },
    { id: '265', name: 'Pangsha', bn_name: 'পাংশা' },
    { id: '266', name: 'Kalukhali', bn_name: 'কালুখালী' }
  ],
  '27': [
    { id: '267', name: 'Gopalganj Sadar', bn_name: 'গোপালগঞ্জ সদর' },
    { id: '268', name: 'Kashiani', bn_name: 'কাশিয়ানী' },
    { id: '269', name: 'Kotalipara', bn_name: 'কোটালীপাড়া' },
    { id: '270', name: 'Muksudpur', bn_name: 'মুকসুদপুর' },
    { id: '271', name: 'Tungipara', bn_name: 'টুঙ্গিপাড়া' }
  ],
  '28': [
    { id: '272', name: 'Faridpur Sadar', bn_name: 'ফরিদপুর সদর' },
    { id: '273', name: 'Alfadanga', bn_name: 'আলফাডাঙ্গা' },
    { id: '274', name: 'Bhanga', bn_name: 'ভাঙ্গা' },
    { id: '275', name: 'Boalmari', bn_name: 'বোয়ালমারী' },
    { id: '276', name: 'Charbhadrasan', bn_name: 'চরভদ্রাসন' },
    { id: '277', name: 'Madhukhali', bn_name: 'মধukhালী' },
    { id: '278', name: 'Nagarkanda', bn_name: 'নগরকান্দা' },
    { id: '279', name: 'Sadarpur', bn_name: 'সদরপুর' },
    { id: '280', name: 'Saltha', bn_name: 'সালথা' }
  ],
  '29': [
    { id: '281', name: 'Madaripur Sadar', bn_name: 'মাদারীপুর সদর' },
    { id: '282', name: 'Kalkini', bn_name: 'কালকিনি' },
    { id: '283', name: 'Rajoir', bn_name: 'রাজৈর' },
    { id: '284', name: 'Shibchar', bn_name: 'শিবচর' }
  ],
  '30': [
    { id: '285', name: 'Shariatpur Sadar', bn_name: 'শরীয়তপুর সদর' },
    { id: '286', name: 'Damudya', bn_name: 'ডামুড্যা' },
    { id: '287', name: 'Gosairhat', bn_name: 'গোসাইরহাট' },
    { id: '288', name: 'Naria', bn_name: 'নড়িয়া' },
    { id: '289', name: 'Zajira', bn_name: 'জাজিরা' },
    { id: '290', name: 'Bhedarganj', bn_name: 'ভেদরগঞ্জ' }
  ],

  // Khulna Division
  '31': [
    { id: '291', name: 'Khulna Sadar', bn_name: 'খুলনা সদর' },
    { id: '292', name: 'Batiaghata', bn_name: 'বটিয়াঘাটা' },
    { id: '293', name: 'Dacope', bn_name: 'দাকোপ' },
    { id: '294', name: 'Dumuria', bn_name: 'ডুমুরিয়া' },
    { id: '295', name: 'Dighalia', bn_name: 'দিঘলিয়া' },
    { id: '296', name: 'Koyra', bn_name: 'কয়রা' },
    { id: '297', name: 'Paikgachha', bn_name: 'পাইকগাছা' },
    { id: '298', name: 'Phultala', bn_name: 'ফুলতলা' },
    { id: '299', name: 'Rupsha', bn_name: 'রূপসা' },
    { id: '300', name: 'Terokhada', bn_name: 'তেরখাদা' }
  ],
  '32': [
    { id: '301', name: 'Bagerhat Sadar', bn_name: 'বাগেরহাট সদর' },
    { id: '302', name: 'Chitalmari', bn_name: 'চিতলমারী' },
    { id: '303', name: 'Fakirhat', bn_name: 'ফকিরহাট' },
    { id: '304', name: 'Kachua', bn_name: 'কচুয়া' },
    { id: '305', name: 'Mollahat', bn_name: 'মোল্লাহাট' },
    { id: '306', name: 'Mongla', bn_name: 'মোংলা' },
    { id: '307', name: 'Morrelganj', bn_name: 'মোড়েলগঞ্জ' },
    { id: '308', name: 'Rampal', bn_name: 'রামপাল' },
    { id: '309', name: 'Sarankhola', bn_name: 'শরণখোলা' }
  ],
  '33': [
    { id: '310', name: 'Chuadanga Sadar', bn_name: 'চুয়াডাঙ্গা সদর' },
    { id: '311', name: 'Alamdanga', bn_name: 'আলমডাঙ্গা' },
    { id: '312', name: 'Damurhuda', bn_name: 'দামুড়হুদা' },
    { id: '313', name: 'Jibannagar', bn_name: 'জীবননগর' }
  ],
  '34': [
    { id: '314', name: 'Jashore Sadar', bn_name: 'যশোর সদর' },
    { id: '315', name: 'Abhaynagar', bn_name: 'অভয়নগর' },
    { id: '316', name: 'Bagherpara', bn_name: 'বাঘারপাড়া' },
    { id: '317', name: 'Chaugachha', bn_name: 'চৌগাছা' },
    { id: '318', name: 'Jhikargachha', bn_name: 'ঝিকরগাছা' },
    { id: '319', name: 'Keshabpur', bn_name: 'কেশবপুর' },
    { id: '320', name: 'Manirampur', bn_name: 'মণিরামপুর' },
    { id: '321', name: 'Sharsha', bn_name: 'শার্শা' }
  ],
  '35': [
    { id: '322', name: 'Jhenaidah Sadar', bn_name: 'ঝিনাইদহ সদর' },
    { id: '323', name: 'Harinakunda', bn_name: 'হরিণাকুণ্ডু' },
    { id: '324', name: 'Kaliganj', bn_name: 'কালীগঞ্জ' },
    { id: '325', name: 'Kotchandpur', bn_name: 'কোটচাঁদপুর' },
    { id: '326', name: 'Maheshpur', bn_name: 'মহেশপুর' },
    { id: '327', name: 'Shailkupa', bn_name: 'শৈলকুপা' }
  ],
  '36': [
    { id: '328', name: 'Kushtia Sadar', bn_name: 'কুষ্টিয়া সদর' },
    { id: '329', name: 'Bheramara', bn_name: 'ভেড়ামারা' },
    { id: '330', name: 'Daulatpur', bn_name: 'দৌলতপুর' },
    { id: '331', name: 'Khoksa', bn_name: 'খোকসা' },
    { id: '332', name: 'Kumarkhali', bn_name: 'কুমারখালী' },
    { id: '333', name: 'Mirpur', bn_name: 'মিরপুর' }
  ],
  '37': [
    { id: '334', name: 'Magura Sadar', bn_name: 'মাগুরা সদর' },
    { id: '335', name: 'Mohammadpur', bn_name: 'মহম্মদপুর' },
    { id: '336', name: 'Shalikha', bn_name: 'শালিখা' },
    { id: '337', name: 'Sreepur', bn_name: 'শ্রীপুর' }
  ],
  '38': [
    { id: '338', name: 'Meherpur Sadar', bn_name: 'মেহেরপুর সদর' },
    { id: '339', name: 'Gangni', bn_name: 'গাংনী' },
    { id: '340', name: 'Mujibnagar', bn_name: 'মুজিবনগর' }
  ],
  '39': [
    { id: '341', name: 'Narail Sadar', bn_name: 'নড়াইল সদর' },
    { id: '342', name: 'Lohagara', bn_name: 'লোহাগড়া' },
    { id: '343', name: 'Kalia', bn_name: 'কালিয়া' }
  ],
  '40': [
    { id: '344', name: 'Satkhira Sadar', bn_name: 'সাতক্ষীরা সদর' },
    { id: '345', name: 'Assasuni', bn_name: 'আশাশুনি' },
    { id: '346', name: 'Debhata', bn_name: 'দেবহাটা' },
    { id: '347', name: 'Kalaroa', bn_name: 'কলারোয়া' },
    { id: '348', name: 'Kaliganj', bn_name: 'কালীগঞ্জ' },
    { id: '349', name: 'Shyamnagar', bn_name: 'শ্যামনগর' },
    { id: '350', name: 'Tala', bn_name: 'তালা' }
  ],

  // Rajshahi Division
  '41': [
    { id: '351', name: 'Rajshahi Sadar', bn_name: 'রাজশাহী সদর' },
    { id: '352', name: 'Bagha', bn_name: 'বাঘা' },
    { id: '353', name: 'Bagmara', bn_name: 'বাগমারা' },
    { id: '354', name: 'Charghat', bn_name: 'চারঘাট' },
    { id: '355', name: 'Durgapur', bn_name: 'দুর্গাপুর' },
    { id: '356', name: 'Godagari', bn_name: 'গোদাগাড়ী' },
    { id: '357', name: 'Mohanpur', bn_name: 'মোহনপুর' },
    { id: '358', name: 'Paba', bn_name: 'পবা' },
    { id: '359', name: 'Puthia', bn_name: 'পুঠিয়া' },
    { id: '360', name: 'Tanore', bn_name: 'তানোর' }
  ],
  '42': [
    { id: '361', name: 'Bogura Sadar', bn_name: 'বগুড়া সদর' },
    { id: '362', name: 'Adamdighi', bn_name: 'আদমদীঘি' },
    { id: '363', name: 'Dhunat', bn_name: 'ধুনট' },
    { id: '364', name: 'Dhupchanchia', bn_name: 'দুপচাঁচিয়া' },
    { id: '365', name: 'Gabtali', bn_name: 'গাবতলী' },
    { id: '366', name: 'Kahaloo', bn_name: 'কাহালু' },
    { id: '367', name: 'Nandigram', bn_name: 'নন্দীগ্রাম' },
    { id: '368', name: 'Sariakandi', bn_name: 'সারিয়াকান্দি' },
    { id: '369', name: 'Sherpur', bn_name: 'শেরপুর' },
    { id: '370', name: 'Shibganj', bn_name: 'শিবগঞ্জ' },
    { id: '371', name: 'Sonatola', bn_name: 'সোনাতলা' },
    { id: '372', name: 'Shajahanpur', bn_name: 'শাজাহানপুর' }
  ],
  '43': [
    { id: '373', name: 'Joypurhat Sadar', bn_name: 'জয়পুরহাট সদর' },
    { id: '374', name: 'Akkelpur', bn_name: 'আক্কেলপুর' },
    { id: '375', name: 'Kalai', bn_name: 'কালাই' },
    { id: '376', name: 'Khetlal', bn_name: 'ক্ষেতলাল' },
    { id: '377', name: 'Panchbibi', bn_name: 'পাঁচবিবি' }
  ],
  '44': [
    { id: '378', name: 'Naogaon Sadar', bn_name: 'নওগাঁ সদর' },
    { id: '379', name: 'Atrai', bn_name: 'আত্রাই' },
    { id: '380', name: 'Badalgachhi', bn_name: 'বদলগাছী' },
    { id: '381', name: 'Dhamoirhat', bn_name: 'ধামইরহাট' },
    { id: '382', name: 'Manda', bn_name: 'মান্দা' },
    { id: '383', name: 'Mahadevpur', bn_name: 'মহাদেবপুর' },
    { id: '384', name: 'Niamatpur', bn_name: 'নিয়ামতপুর' },
    { id: '385', name: 'Patnitala', bn_name: 'পত্নীতলা' },
    { id: '386', name: 'Porsha', bn_name: 'পোরশা' },
    { id: '387', name: 'Raninagar', bn_name: 'রানীনগর' },
    { id: '388', name: 'Sapahar', bn_name: 'সাপাহার' }
  ],
  '45': [
    { id: '389', name: 'Natore Sadar', bn_name: 'নাটোর সদর' },
    { id: '390', name: 'Bagatipara', bn_name: 'বাগাতিপাড়া' },
    { id: '391', name: 'Baraigram', bn_name: 'বড়াইগ্রাম' },
    { id: '392', name: 'Gurudaspur', bn_name: 'গুরুদাসপুর' },
    { id: '393', name: 'Lalpur', bn_name: 'লালপুর' },
    { id: '394', name: 'Singra', bn_name: 'সিংড়া' },
    { id: '395', name: 'Naldanga', bn_name: 'নলডাঙ্গা' }
  ],
  '46': [
    { id: '396', name: 'Pabna Sadar', bn_name: 'পাবনা সদর' },
    { id: '397', name: 'Atgharia', bn_name: 'আটঘড়িয়া' },
    { id: '398', name: 'Bera', bn_name: 'বেড়া' },
    { id: '399', name: 'Bhangura', bn_name: 'ভাঙ্গুড়া' },
    { id: '400', name: 'Chatmohar', bn_name: 'চাটমোহর' },
    { id: '401', name: 'Faridpur', bn_name: 'ফরিদপুর' },
    { id: '402', name: 'Ishwardi', bn_name: 'ঈশ্বরদী' },
    { id: '403', name: 'Santhia', bn_name: 'সাঁথিয়া' },
    { id: '404', name: 'Sujanagar', bn_name: 'সুজানগর' }
  ],
  '47': [
    { id: '405', name: 'Sirajganj Sadar', bn_name: 'সিরাজগঞ্জ সদর' },
    { id: '406', name: 'Belkuchi', bn_name: 'বেলকুচি' },
    { id: '407', name: 'Chauhali', bn_name: 'চৌহালী' },
    { id: '408', name: 'Kamarkhanda', bn_name: 'কামারখন্দ' },
    { id: '409', name: 'Kazipur', bn_name: 'কাজীপুর' },
    { id: '410', name: 'Raiganj', bn_name: 'রায়গঞ্জ' },
    { id: '411', name: 'Shahjadpur', bn_name: 'শাহজাদপুর' },
    { id: '412', name: 'Tarash', bn_name: 'তাড়াশ' },
    { id: '413', name: 'Ullahpara', bn_name: 'উল্লাপাড়া' }
  ],
  '48': [
    { id: '414', name: 'Chapai Nawabganj Sadar', bn_name: 'চাঁপাইনবাবগঞ্জ সদর' },
    { id: '415', name: 'Bholahat', bn_name: 'ভোলাহাট' },
    { id: '416', name: 'Gomastapur', bn_name: 'গোমস্তাপুর' },
    { id: '417', name: 'Nachole', bn_name: 'নাচোল' },
    { id: '418', name: 'Shibganj', bn_name: 'শিবগঞ্জ' }
  ],

  // Rangpur Division
  '49': [
    { id: '419', name: 'Rangpur Sadar', bn_name: 'রংপুর সদর' },
    { id: '420', name: 'Badarganj', bn_name: 'বদরগঞ্জ' },
    { id: '421', name: 'Gangachhara', bn_name: 'গঙ্গাচড়া' },
    { id: '422', name: 'Kaunia', bn_name: 'কাউনিয়া' },
    { id: '423', name: 'Mithapukur', bn_name: 'মিঠাপুকুর' },
    { id: '424', name: 'Pirgachha', bn_name: 'পীরগাছা' },
    { id: '425', name: 'Pirganj', bn_name: 'পীরগঞ্জ' },
    { id: '426', name: 'Taraganj', bn_name: 'তারাগঞ্জ' }
  ],
  '50': [
    { id: '427', name: 'Dinajpur Sadar', bn_name: 'দিনাজপুর সদর' },
    { id: '428', name: 'Birampur', bn_name: 'বিরামপুর' },
    { id: '429', name: 'Birganj', bn_name: 'বীরগঞ্জ' },
    { id: '430', name: 'Birol', bn_name: 'বিরল' },
    { id: '431', name: 'Bochaganj', bn_name: 'বোচাগঞ্জ' },
    { id: '432', name: 'Chirirbandar', bn_name: 'চিরিরবন্দর' },
    { id: '433', name: 'Phulbari', bn_name: 'ফুলবাড়ী' },
    { id: '434', name: 'Ghoraghat', bn_name: 'ঘোড়াঘাট' },
    { id: '435', name: 'Hakimpur', bn_name: 'হাকিমপুর' },
    { id: '436', name: 'Kaharole', bn_name: 'কাহারোল' },
    { id: '437', name: 'Khansama', bn_name: 'খানসামা' },
    { id: '438', name: 'Nawabganj', bn_name: 'নবাবগঞ্জ' },
    { id: '439', name: 'Parbatipur', bn_name: 'পার্বতীপুর' }
  ],
  '51': [
    { id: '440', name: 'Gaibandha Sadar', bn_name: 'গাইবান্ধা সদর' },
    { id: '441', name: 'Phulchhari', bn_name: 'ফুলছড়ি' },
    { id: '442', name: 'Gobindaganj', bn_name: 'গোবিন্দগঞ্জ' },
    { id: '443', name: 'Palashbari', bn_name: 'পলাশবাড়ী' },
    { id: '444', name: 'Sadullapur', bn_name: 'সাদুল্লাপুর' },
    { id: '445', name: 'Saghata', bn_name: 'সাঘাটা' },
    { id: '446', name: 'Sundarganj', bn_name: 'সুন্দরগঞ্জ' }
  ],
  '52': [
    { id: '447', name: 'Kurigram Sadar', bn_name: 'কুড়িগ্রাম সদর' },
    { id: '448', name: 'Bhurungamari', bn_name: 'ভুরুঙ্গামারী' },
    { id: '449', name: 'Char Rajibpur', bn_name: 'রাজিবপুর' },
    { id: '450', name: 'Chilmari', bn_name: 'চিলমারী' },
    { id: '451', name: 'Phulbari', bn_name: 'ফুলবাড়ী' },
    { id: '452', name: 'Nageshwari', bn_name: 'নাগেশ্বরী' },
    { id: '453', name: 'Rajarhat', bn_name: 'রাজারহাট' },
    { id: '454', name: 'Roumari', bn_name: 'রৌমারী' },
    { id: '455', name: 'Ulipur', bn_name: 'উলিপুর' }
  ],
  '53': [
    { id: '456', name: 'Lalmonirhat Sadar', bn_name: 'লালমনিরহাট সদর' },
    { id: '457', name: 'Aditmari', bn_name: 'আদিতমারী' },
    { id: '458', name: 'Hatibandha', bn_name: 'হাতীবান্ধা' },
    { id: '459', name: 'Kaliganj', bn_name: 'কালীগঞ্জ' },
    { id: '460', name: 'Patgram', bn_name: 'পাটগ্রাম' }
  ],
  '54': [
    { id: '461', name: 'Nilphamari Sadar', bn_name: 'নীলফামারী সদর' },
    { id: '462', name: 'Dimla', bn_name: 'ডিমলা' },
    { id: '463', name: 'Domar', bn_name: 'ডোমার' },
    { id: '464', name: 'Jaldhaka', bn_name: 'জলঢাকা' },
    { id: '465', name: 'Kishoreganj', bn_name: 'কিশোরগঞ্জ' },
    { id: '466', name: 'Saidpur', bn_name: 'সৈয়দপুর' }
  ],
  '55': [
    { id: '467', name: 'Panchagarh Sadar', bn_name: 'পঞ্চগড় সদর' },
    { id: '468', name: 'Atwari', bn_name: 'আটোয়ারী' },
    { id: '469', name: 'Boda', bn_name: 'বোদা' },
    { id: '470', name: 'Debiganj', bn_name: 'দেবীগঞ্জ' },
    { id: '471', name: 'Tetulia', bn_name: 'তেঁতুলিয়া' }
  ],
  '56': [
    { id: '472', name: 'Thakurgaon Sadar', bn_name: 'ঠাকুরগাঁও সদর' },
    { id: '473', name: 'Baliadangi', bn_name: 'বালিয়াডাঙ্গী' },
    { id: '474', name: 'Haripur', bn_name: 'হরিপুর' },
    { id: '475', name: 'Pirganj', bn_name: 'পীরগঞ্জ' },
    { id: '476', name: 'Ranisankail', bn_name: 'রানীশংকৈল' }
  ],

  // Sylhet Division
  '57': [
    { id: '477', name: 'Sylhet Sadar', bn_name: 'সিলেট সদর' },
    { id: '478', name: 'Beanibazar', bn_name: 'বিয়ানীবাজার' },
    { id: '479', name: 'Bishwanath', bn_name: 'বিশ্বনাথ' },
    { id: '480', name: 'Dakshin Surma', bn_name: 'দক্ষিণ সুরমা' },
    { id: '481', name: 'Balaganj', bn_name: 'বালাগঞ্জ' },
    { id: '482', name: 'Companiganj', bn_name: 'কোম্পানীগঞ্জ' },
    { id: '483', name: 'Fenchuganj', bn_name: 'ফেঞ্চুগঞ্জ' },
    { id: '484', name: 'Golapganj', bn_name: 'গোলাপগঞ্জ' },
    { id: '485', name: 'Gowainghat', bn_name: 'গোয়াইনঘাট' },
    { id: '486', name: 'Jaintiapur', bn_name: 'জৈন্তাপুর' },
    { id: '487', name: 'Kanaighat', bn_name: 'কানাইঘাট' },
    { id: '488', name: 'Osmani Nagar', bn_name: 'ওসমানী নগর' },
    { id: '489', name: 'Zakiganj', bn_name: 'জকিগঞ্জ' }
  ],
  '58': [
    { id: '490', name: 'Habiganj Sadar', bn_name: 'হবিগঞ্জ সদর' },
    { id: '491', name: 'Ajmiriganj', bn_name: 'আজমিরীগঞ্জ' },
    { id: '492', name: 'Bahubal', bn_name: 'বাহুবল' },
    { id: '493', name: 'Baniyachong', bn_name: 'বানিয়াচং' },
    { id: '494', name: 'Chunarughat', bn_name: 'চুনারুঘাট' },
    { id: '495', name: 'Lakhai', bn_name: 'লাখাই' },
    { id: '496', name: 'Madhabpur', bn_name: 'মাধবপুর' },
    { id: '497', name: 'Nabiganj', bn_name: 'নবীগঞ্জ' },
    { id: '498', name: 'Sayestaganj', bn_name: 'শায়েস্তাগঞ্জ' }
  ],
  '59': [
    { id: '499', name: 'Moulvibazar Sadar', bn_name: 'মৌলভীবাজার সদর' },
    { id: '500', name: 'Barlekha', bn_name: 'বড়লেখা' },
    { id: '501', name: 'Kamalganj', bn_name: 'কমলগঞ্জ' },
    { id: '502', name: 'Kulaura', bn_name: 'কুলাউড়া' },
    { id: '503', name: 'Rajnagar', bn_name: 'রাজনগর' },
    { id: '504', name: 'Sreemangal', bn_name: 'শ্রীমঙ্গল' },
    { id: '505', name: 'Juri', bn_name: 'জুড়ী' }
  ],
  '60': [
    { id: '506', name: 'Sunamganj Sadar', bn_name: 'সুনামগঞ্জ সদর' },
    { id: '507', name: 'Bishwamarpur', bn_name: 'বিশ্বম্ভরপুর' },
    { id: '508', name: 'Chhatak', bn_name: 'ছাতক' },
    { id: '509', name: 'Derai', bn_name: 'দিরাই' },
    { id: '510', name: 'Dharamapasha', bn_name: 'ধর্মপাশা' },
    { id: '511', name: 'Dowarabazar', bn_name: 'দোয়ারাবাজার' },
    { id: '512', name: 'Jagannathpur', bn_name: 'জগন্নাথপুর' },
    { id: '513', name: 'Jamalganj', bn_name: 'জামালগঞ্জ' },
    { id: '514', name: 'Sullah', bn_name: 'শাল্লা' },
    { id: '515', name: 'Tahirpur', bn_name: 'তাহিরপুর' },
    { id: '516', name: 'South Sunamganj', bn_name: 'দক্ষিণ সুনামগঞ্জ' }
  ],
  '61': [
    { id: '517', name: 'Mymensingh Sadar', bn_name: 'ময়মনসিংহ সদর' },
    { id: '518', name: 'Bhaluka', bn_name: 'ভালুকা' },
    { id: '519', name: 'Dhobaura', bn_name: 'ধোবাউড়া' },
    { id: '520', name: 'Fulbaria', bn_name: 'ফুলবাড়ীয়া' },
    { id: '521', name: 'Gaffargaon', bn_name: 'গফরগাঁও' },
    { id: '522', name: 'Gauripur', bn_name: 'গৌরীপুর' },
    { id: '523', name: 'Haluaghat', bn_name: 'হালুয়াঘাট' },
    { id: '524', name: 'Ishwarganj', bn_name: 'ঈশ্বরগঞ্জ' },
    { id: '525', name: 'Muktagachha', bn_name: 'মুক্তাগাছা' },
    { id: '526', name: 'Nandail', bn_name: 'নান্দাইল' },
    { id: '527', name: 'Phulpur', bn_name: 'ফুলপুর' },
    { id: '528', name: 'Trishal', bn_name: 'ত্রিশাল' },
    { id: '529', name: 'Tara Khanda', bn_name: 'তারাকান্দা' }
  ],
  '62': [
    { id: '530', name: 'Jamalpur Sadar', bn_name: 'জামালপুর সদর' },
    { id: '531', name: 'Baksiganj', bn_name: 'বকশীগঞ্জ' },
    { id: '532', name: 'Dewanganj', bn_name: 'দেওয়ানগঞ্জ' },
    { id: '533', name: 'Islampur', bn_name: 'ইসলামপুর' },
    { id: '534', name: 'Madarganj', bn_name: 'মাদারগঞ্জ' },
    { id: '535', name: 'Melandaha', bn_name: 'মেলান্দহ' },
    { id: '536', name: 'Sarishabari', bn_name: 'সরিষাবাড়ী' }
  ],
  '63': [
    { id: '537', name: 'Netrokona Sadar', bn_name: 'নেত্রকোণা সদর' },
    { id: '538', name: 'Atpara', bn_name: 'আটপাড়া' },
    { id: '539', name: 'Barhatta', bn_name: 'বারহাট্টা' },
    { id: '540', name: 'Durgapur', bn_name: 'দুর্গাপুর' },
    { id: '541', name: 'Khaliajuri', bn_name: 'খালিয়াজুরী' },
    { id: '542', name: 'Kalmakanda', bn_name: 'কলমাকান্দা' },
    { id: '543', name: 'Kendua', bn_name: 'কেন্দুয়া' },
    { id: '544', name: 'Madan', bn_name: 'মদন' },
    { id: '545', name: 'Mohanganj', bn_name: 'মোহনগঞ্জ' },
    { id: '546', name: 'Purbadhala', bn_name: 'পূর্বধলা' }
  ],
  '64': [
    { id: '547', name: 'Sherpur Sadar', bn_name: 'শেরপুর সদর' },
    { id: '548', name: 'Jhenaigati', bn_name: 'ঝিনাইগাতী' },
    { id: '549', name: 'Nakla', bn_name: 'নকলা' },
    { id: '550', name: 'Nalitabari', bn_name: 'নালিতাবাড়ী' },
    { id: '551', name: 'Sreebardi', bn_name: 'শ্রীবরদী' }
  ]
};

export const getUpazilasForDistrict = (districtId: string): BDLocation[] => {
  return UPAZILAS[districtId] || [{ id: '999', name: 'Sadar Upazila', bn_name: 'সদর উপজেলা' }];
};
