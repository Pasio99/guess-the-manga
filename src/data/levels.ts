import type { Level } from '../domain/types';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const levels: readonly Level[] = [
  {
    id: 'naruto',
    title: 'Manga #1',
    shortTitle: 'Manga #1',
    panels: [
      {
        id: 'naruto-1',
        src: asset('/images/Naruto/image1.png'),
        answer: 'Naruto',
        acceptedAnswers: ['Naruto', 'ナルト'],
        hint: 'No hint'
      },
      {
        id: 'naruto-2',
        src: asset('/images/Naruto/image2Naruto.png'),
        answer: 'Naruto',
        acceptedAnswers: ['Naruto', 'ナルト'],
        hint: 'Target: Shonen'
      },
      {
        id: 'naruto-3',
        src: asset('/images/Naruto/Naruto3.png'),
        answer: 'Naruto',
        acceptedAnswers: ['Naruto', 'ナルト'],
        hint: 'Ended, N° of Tome: 72, Chapters: 700'
      },
      {
        id: 'naruto-4',
        src: asset('/images/Naruto/Naruto5.png'),
        answer: 'Naruto',
        acceptedAnswers: ['Naruto', 'ナルト'],
        hint: "I'm gonna become Hokage!"
      }
    ]
  },
  {
    id: 'one-piece',
    title: 'Manga #2',
    shortTitle: 'Manga #2',
    panels: [
      {
        id: 'one-piece-1',
        src: asset('/images/OnePiece/Op1.png'),
        answer: 'One Piece',
        acceptedAnswers: ['One Piece', 'OnePiece', 'ワンピース'],
        hint: 'No hint'
      },
      {
        id: 'one-piece-2',
        src: asset('/images/OnePiece/Op2.png'),
        answer: 'One Piece',
        acceptedAnswers: ['One Piece', 'OnePiece', 'ワンピース'],
        hint: 'Target: Shonen'
      },
      {
        id: 'one-piece-3',
        src: asset('/images/OnePiece/Op3.png'),
        answer: 'One Piece',
        acceptedAnswers: ['One Piece', 'OnePiece', 'ワンピース'],
        hint: 'Not Ended, N° of Tome: 114+, Chapters: 1176+'
      },
      {
        id: 'one-piece-4',
        src: asset('/images/OnePiece/Op4.png'),
        answer: 'One Piece',
        acceptedAnswers: ['One Piece', 'OnePiece', 'ワンピース'],
        hint: "I'm Luffy! The Man Who Will Become the Pirate King!"
      }
    ]
  },
  {
    id: 'bugle-call',
    title: 'Manga #3',
    shortTitle: 'Manga #3',
    panels: [
      {
        id: 'bugle-call-1',
        src: asset('/images/BugleCall/1.png'),
        answer: 'The Bugle Call',
        acceptedAnswers: ['The Bugle Call', 'Bugle Call'],
        hint: 'No hint'
      },
      {
        id: 'bugle-call-2',
        src: asset('/images/BugleCall/2.png'),
        answer: 'The Bugle Call',
        acceptedAnswers: ['The Bugle Call', 'Bugle Call'],
        hint: 'Target: Shonen'
      },
      {
        id: 'bugle-call-3',
        src: asset('/images/BugleCall/3.png'),
        answer: 'The Bugle Call',
        acceptedAnswers: ['The Bugle Call', 'Bugle Call'],
        hint: 'Not Ended, Started in 2022, N° of tome: 13+'
      },
      {
        id: 'bugle-call-4',
        src: asset('/images/BugleCall/4.png'),
        answer: 'The Bugle Call',
        acceptedAnswers: ['The Bugle Call', 'Bugle Call'],
        hint: 'The main character hates the world and plays the trumpet, his name is Luca'
      }
    ]
  },
  {
    id: 'dandadan',
    title: 'Manga #4',
    shortTitle: 'Manga #4',
    panels: [
      {
        id: 'dandadan-1',
        src: asset('/images/Dandadan/Livello1.png'),
        answer: 'Dandadan',
        acceptedAnswers: ['Dandadan', 'Dan Da Dan', 'Dan Dadan'],
        hint: 'No hint'
      },
      {
        id: 'dandadan-2',
        src: asset('/images/Dandadan/Livello2.png'),
        answer: 'Dandadan',
        acceptedAnswers: ['Dandadan', 'Dan Da Dan', 'Dan Dadan'],
        hint: 'Target: Shonen'
      },
      {
        id: 'dandadan-3',
        src: asset('/images/Dandadan/Livello3.png'),
        answer: 'Dandadan',
        acceptedAnswers: ['Dandadan', 'Dan Da Dan', 'Dan Dadan'],
        hint: 'Not Ended, Started in 2021, N° of tome: 22+'
      },
      {
        id: 'dandadan-4',
        src: asset('/images/Dandadan/Livello4.png'),
        answer: 'Dandadan',
        acceptedAnswers: ['Dandadan', 'Dan Da Dan', 'Dan Dadan'],
        hint: "Okarun's Golden Balls"
      }
    ]
  },
  {
    id: 'the-music-of-marie',
    title: 'Manga #5',
    shortTitle: 'Manga #5',
    panels: [
      {
        id: 'marie-1',
        src: asset('/images/MusicMarie/1.png'),
        answer: 'The Music of Marie',
        acceptedAnswers: ['The Music of Marie', 'Music of Marie', "Marie's Music"],
        hint: 'No hint'
      },
      {
        id: 'marie-2',
        src: asset('/images/MusicMarie/2.png'),
        answer: 'The Music of Marie',
        acceptedAnswers: ['The Music of Marie', 'Music of Marie', "Marie's Music"],
        hint: 'Target: Seinen'
      },
      {
        id: 'marie-3',
        src: asset('/images/MusicMarie/3.png'),
        answer: 'The Music of Marie',
        acceptedAnswers: ['The Music of Marie', 'Music of Marie', "Marie's Music"],
        hint: 'Ended, N° of Tome: 2, Chapters: 17, It started in 1999 and ended in 2001'
      },
      {
        id: 'marie-4',
        src: asset('/images/MusicMarie/4.png'),
        answer: 'The Music of Marie',
        acceptedAnswers: ['The Music of Marie', 'Music of Marie', "Marie's Music"],
        hint: 'The mangaka is Usamaru Furuya, and the manga features a goddess named Marie.'
      }
    ]
  }
] as const;

export const getLevelById = (levelId: string) => levels.find((level) => level.id === levelId) ?? levels[0];
export const firstLevelId = levels[0].id;
