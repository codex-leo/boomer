export interface SongQuestion {
  id: string;
  title: string;
  movie: string;
  artist?: string;
  youtubeId: string;
  aliases: string[];
}

export const SONG_QUESTIONS: SongQuestion[] = [
  {
    id: "song-001",
    title: "Tum Hi Ho",
    movie: "Aashiqui 2",
    youtubeId: "Umqb9KENgmk",
    aliases: [
      "tum hi ho",
      "tumhi ho",
    ],
  },

  {
    id: "song-002",
    title: "Chaiyya Chaiyya",
    movie: "Dil Se",
    youtubeId: "9MX-QejdVaQ",
    aliases: [
      "chaiyya chaiyya",
      "chaiya chaiya",
      "chaiyya",
    ],
  },

  {
    id: "song-003",
    title: "Kal Ho Naa Ho",
    movie: "Kal Ho Naa Ho",
    youtubeId: "g0eO74UmRBs",
    aliases: [
      "kal ho na ho",
      "kal ho naa ho",
    ],
  },

  {
    id: "song-004",
    title: "Badtameez Dil",
    movie: "Yeh Jawaani Hai Deewani",
    youtubeId: "II2EO3Nw4m0",
    aliases: [
      "badtameez dil",
      "badtameez",
    ],
  },

  {
    id: "song-005",
    title: "Aankhon Mein Teri",
    movie: "Om Shanti Om",
    youtubeId: "8tAxzESfBl4",
    aliases: [
      "aankhon mein teri",
      "aankhon me teri",
      "aakho me teri"
    ],
  },

  {
    id: "song-006",
    title: "Tere Liye",
    movie: "Prince",
    youtubeId: "gO8qvYIulKc",
    aliases: [
      "tere liye",
      "tere leeye",
    ],
  },

  {
    id: "song-007",
    title: "Shararat",
    movie: "Dhurandhar",
    youtubeId: "emCF66u7BHk",
    aliases: [
      "shararat",
      "sararat",
    ],
  },

  {
    id: "song-008",
    title: "Beedi Jalaile",
    movie: "Omkara",
    youtubeId: "XLJCtZK0x5M",
    aliases: [
      "beedi Jalale",
    ],
  },

  {
    id: "song-009",
    title: "Dilbar",
    movie: "Satyameva Jayate",
    youtubeId: "TRa9IMvccjg",
    aliases: [
      "dilbar dilbar",
    ],
  },

  {
    id: "song-010",
    title: "Apna Bana Le",
    movie: "Bhediya",
    youtubeId: "ElZfdU54Cp8",
    aliases: [
      "apna banale",
      "apna banale piya",
    ],
  },

];