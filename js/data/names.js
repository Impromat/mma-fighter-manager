/* ============================================
   MMA Fighter Manager — Name Pools
   ============================================ */

const NAME_POOLS = {
  us: {
    first: ['Marcus', 'Tyler', 'Shane', 'Derek', 'Colby', 'Dustin', 'Bryce', 'Calvin', 'Austin', 'Chase',
            'Jordan', 'Brandon', 'Cody', 'Jake', 'Travis', 'Nathan', 'Ryan', 'Keith', 'Darius', 'Luis'],
    last: ['Williams', 'Johnson', 'Davis', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris',
           'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill']
  },
  br: {
    first: ['Rafael', 'Thiago', 'Gabriel', 'Bruno', 'Lucas', 'Diego', 'Caio', 'Matheus', 'Vitor', 'Anderson',
            'Pedro', 'Guilherme', 'Leonardo', 'Henrique', 'Felipe', 'Igor', 'Renan', 'Rodrigo', 'Carlos', 'Eduardo'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Ferreira', 'Costa', 'Pereira', 'Almeida', 'Nascimento', 'Lima',
           'Ribeiro', 'Barbosa', 'Machado', 'Nogueira', 'Carvalho', 'Moraes', 'Bezerra', 'Tavares', 'Rocha', 'Nunes']
  },
  ru: {
    first: ['Artem', 'Magomed', 'Islam', 'Zabit', 'Khamzat', 'Ruslan', 'Petr', 'Sergei', 'Andrei', 'Viktor',
            'Alexei', 'Dmitri', 'Marat', 'Timur', 'Said', 'Shamil', 'Tagir', 'Abdul', 'Movsar', 'Yuri'],
    last: ['Nurmagomedov', 'Ismailov', 'Tsarukyan', 'Volkov', 'Ankalaev', 'Tumenov', 'Pavlovich', 'Yankov', 'Emelianov', 'Abdullaev',
           'Magomedov', 'Dvalishvili', 'Chimaev', 'Usman', 'Gamzatov', 'Mokaev', 'Fiziev', 'Shavkatov', 'Aliev', 'Taktarov']
  },
  ie: {
    first: ['Conor', 'Sean', 'Paddy', 'Ciaran', 'Declan', 'Finn', 'Rory', 'Cian', 'Eoin', 'Niall',
            'Darragh', 'Liam', 'Oisin', 'Cathal', 'Killian', 'Aidan', 'Brendan', 'Ronan', 'Patrick', 'Colin'],
    last: ["O'Brien", "Murphy", "Kelly", "Walsh", "Byrne", "Ryan", "O'Connor", "Doyle", "McCarthy", "Gallagher",
           "Daly", "O'Sullivan", "Quinn", "McLoughlin", "Kavanagh", "Duffy", "Brennan", "Casey", "Healy", "Maguire"]
  },
  mx: {
    first: ['Alejandro', 'Diego', 'Yair', 'Brandon', 'Carlos', 'Raul', 'Hector', 'Oscar', 'Erik', 'Manuel',
            'Miguel', 'Roberto', 'Santiago', 'Arturo', 'Fernando', 'Javier', 'Ricardo', 'Sergio', 'Andres', 'Luis'],
    last: ['Rodriguez', 'Moreno', 'Hernandez', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Torres', 'Ramirez', 'Sanchez',
           'Diaz', 'Cruz', 'Reyes', 'Flores', 'Gomez', 'Rivera', 'Castillo', 'Mendoza', 'Vargas', 'Ortiz']
  },
  jp: {
    first: ['Kai', 'Mikuru', 'Tatsuro', 'Yusuke', 'Takashi', 'Ryoto', 'Naoki', 'Daichi', 'Kenji', 'Haruki',
            'Shoma', 'Ryo', 'Hiroto', 'Takanori', 'Yutaka', 'Kazushi', 'Atsushi', 'Masahiro', 'Tetsuya', 'Kyoji'],
    last: ['Asakura', 'Takahashi', 'Yamamoto', 'Nakamura', 'Ishihara', 'Suzuki', 'Tanaka', 'Watanabe', 'Kato', 'Inoue',
           'Sato', 'Horiguchi', 'Sakurai', 'Fujita', 'Aoki', 'Maeda', 'Ito', 'Matsuda', 'Shimizu', 'Hayashi']
  },
  ng: {
    first: ['Kamaru', 'Israel', 'Sodiq', 'Kennedy', 'Chidi', 'Oluwale', 'Emeka', 'Obinna', 'Uche', 'Tunde',
            'Adesanya', 'Babatunde', 'Chijioke', 'Dayo', 'Femi', 'Ikenna', 'Kehinde', 'Nonso', 'Segun', 'Yinka'],
    last: ['Usman', 'Adesanya', 'Yusuff', 'Nzechukwu', 'Njokuani', 'Okafor', 'Adegbuyi', 'Nwosu', 'Onama', 'Ige',
           'Bukauskas', 'Adeyemi', 'Ogundeji', 'Chimaeze', 'Ajayi', 'Okonkwo', 'Eze', 'Mbappe', 'Adamu', 'Obinna']
  },
  fr: {
    first: ['Cyril', 'Nassourdine', 'Benoit', 'Morgan', 'Manon', 'Taylor', 'William', 'Ciryl', 'Hugo', 'Sofiane',
            'Romain', 'Florian', 'Mathieu', 'Alexandre', 'Julien', 'Thomas', 'Nicolas', 'Louis', 'Maxime', 'Antoine'],
    last: ['Gane', 'Imavov', 'Saint-Denis', 'Charriere', 'Lapilus', 'Gomis', 'Douma', 'Bonfils', 'Ngannou', 'Boukichou',
           'Dumont', 'Fernandez', 'Marchand', 'Petit', 'Laurent', 'Bernard', 'Dubois', 'Leroy', 'Moreau', 'Lefebvre']
  },
  gb: {
    first: ['Leon', 'Tom', 'Arnold', 'Jack', 'Nathaniel', 'Paddy', 'Molly', 'Paul', 'Michael', 'Darren',
            'Danny', 'Ross', 'Luke', 'Harry', 'James', 'George', 'Oliver', 'William', 'Charlie', 'Alfie'],
    last: ['Edwards', 'Aspinall', 'Allen', 'Shore', 'Wood', 'Craig', 'Sherdog', 'Till', 'Bisping', 'Hardy',
           'Thompson', 'Johnson', 'Smith', 'Brown', 'Wilson', 'Davis', 'Evans', 'Hughes', 'Turner', 'Cooper']
  },
  au: {
    first: ['Robert', 'Alexander', 'Tai', 'Tyson', 'Jimmy', 'Jake', 'Shannon', 'Josh', 'Kyle', 'Callan',
            'Liam', 'Ethan', 'Cooper', 'Riley', 'Noah', 'Mason', 'Darcy', 'Beau', 'Zac', 'Angus'],
    last: ['Whittaker', 'Volkanovski', 'Tuivasa', 'Pedro', 'Crute', 'Matthews', 'Ross', 'Kelly', 'Harris', 'Nguyen',
           'Clarke', 'Mitchell', 'Robinson', 'Walker', 'Martin', 'Thompson', 'Anderson', 'White', 'Jackson', 'King']
  },
  pl: {
    first: ['Jan', 'Marcin', 'Mateusz', 'Krzysztof', 'Michal', 'Damian', 'Szymon', 'Rafal', 'Jakub', 'Tomasz',
            'Piotr', 'Dawid', 'Grzegorz', 'Karol', 'Wojciech', 'Adam', 'Marek', 'Filip', 'Bartosz', 'Sebastian'],
    last: ['Blachowicz', 'Tybura', 'Gamrot', 'Jotko', 'Oleksiejczuk', 'Sobotta', 'Wrzosek', 'Pawlak', 'Szymanski', 'Kowalski',
           'Wozniak', 'Kaminski', 'Lewandowski', 'Nowak', 'Mazur', 'Krawczyk', 'Piotrowski', 'Zielinski', 'Grabowski', 'Rutkowski']
  },
  kr: {
    first: ['Chan', 'Sung', 'Dong', 'Doo', 'Seung', 'Min', 'Jung', 'Da', 'Hyun', 'Tae',
            'Jae', 'Yong', 'Woo', 'Jin', 'Soo', 'Kyung', 'Sang', 'Hoon', 'Guk', 'Byung'],
    last: ['Jung', 'Kim', 'Lee', 'Park', 'Choi', 'Kang', 'Cho', 'Yoon', 'Song', 'Lim',
           'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Yoo', 'Jeon', 'Moon']
  },
  se: {
    first: ['Alexander', 'Ilir', 'Niklas', 'David', 'Oscar', 'Magnus', 'Erik', 'Per', 'Andreas', 'Martin',
            'Lars', 'Emil', 'Viktor', 'Anton', 'Gustav', 'Axel', 'Nils', 'Hugo', 'Rasmus', 'Lukas'],
    last: ['Gustafsson', 'Latifi', 'Backstrom', 'Teymur', 'Lindberg', 'Nilsson', 'Johansson', 'Eriksson', 'Larsson', 'Andersson',
           'Karlsson', 'Svensson', 'Persson', 'Olsson', 'Pettersson', 'Jonsson', 'Hansson', 'Bengtsson', 'Lindqvist', 'Axelsson']
  },
  ge: {
    first: ['Merab', 'Giga', 'Lelo', 'Ilia', 'Zurab', 'Levan', 'Giorgi', 'Dato', 'Tornike', 'Revaz',
            'Beka', 'Davit', 'Saba', 'Nikoloz', 'Vakhtang', 'Nika', 'Archil', 'Zaza', 'Irakli', 'Temur'],
    last: ['Dvalishvili', 'Chikadze', 'Kutateladze', 'Topuria', 'Tsintsadze', 'Kakauridze', 'Mchedlishvili', 'Shavkatov', 'Berishvili', 'Gogolashvili',
           'Javakhishvili', 'Lomidze', 'Nadiradze', 'Tsertsvadze', 'Kvaratskhelia', 'Lobzhanidze', 'Mekvabishvili', 'Revishvili', 'Shalamberidze', 'Tedoradze']
  },
  dz: {
    first: ['Mohamed', 'Youssef', 'Amir', 'Karim', 'Sofiane', 'Bilal', 'Walid', 'Nabil', 'Riad', 'Mehdi',
            'Said', 'Hamza', 'Omar', 'Rachid', 'Fouad', 'Tarek', 'Farid', 'Amine', 'Ismail', 'Djamel'],
    last: ['Benhamou', 'Belkalem', 'Bougherra', 'Medjani', 'Mandi', 'Benzia', 'Ghezzal', 'Slimani', 'Brahimi', 'Mahrez',
           'Feghouli', 'Bensaidi', 'Touzani', 'Haddad', 'Khelifi', 'Ait-Kaci', 'Bounedjah', 'Zerrouki', 'Belaili', 'Amoura']
  }
};

/**
 * Generate a random name for a given nationality
 */
function generateName(nationalityId) {
  const pool = NAME_POOLS[nationalityId];
  if (!pool) return { first: 'John', last: 'Doe' };
  const first = pool.first[Math.floor(Math.random() * pool.first.length)];
  const last = pool.last[Math.floor(Math.random() * pool.last.length)];
  return { first, last };
}

/**
 * Generate a unique name that doesn't conflict with existing fighters
 */
function generateUniqueName(nationalityId, existingNames) {
  let attempts = 0;
  let name;
  do {
    name = generateName(nationalityId);
    attempts++;
  } while (existingNames.includes(`${name.first} ${name.last}`) && attempts < 50);
  return name;
}
