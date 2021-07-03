import { DataSource } from 'apollo-datasource';
import * as stemmer from '../korean/stemmer';
import conjugator, {
  Conjugation as RawConjugation,
} from '../korean/conjugator';
import { Conjugation, FavInput, SpeechLevel, Tense } from './types';

export default class ConjugationAPI extends DataSource {
  constructor() {
    super();
  }

  fetchConjugations(
    stem: string,
    isAdj: boolean,
    honorific: boolean,
    regular: boolean,
    conjugationNames: string[],
  ): Conjugation[] {
    if (regular === null || regular === undefined) {
      // returns either 'regular verb' or type of irregular
      regular = conjugator.verb_type(stem, false) === 'regular verb';
    }

    if (conjugationNames != null) {
      for (let i = 0; i < conjugationNames.length; i++) {
        conjugationNames[i] = conjugationNames[i].toLowerCase();
      }
    }

    const data = [];
    conjugator.conjugate(stem, regular, isAdj, honorific, (conjugations) => {
      conjugations.forEach((c) => {
        const conjugation = ConjugationAPI.conjugationReducer(c);
        // If a list of conjugations was provided, check if this conjugation is part of the list
        if (
          conjugationNames != null &&
          conjugationNames.includes(conjugation.name)
        ) {
          data.push(conjugation);
        } else if (conjugationNames == null) {
          // No list was provided, add all conjugations
          data.push(conjugation);
        }
      });
    });
    return data;
  }

  fetchFavorites(
    stem: string,
    isAdj: boolean,
    regular: boolean,
    favorites: FavInput[],
  ): Conjugation[] {
    if (regular === null || regular === undefined) {
      // returns either 'regular verb' or type of irregular
      regular = conjugator.verb_type(stem, false) === 'regular verb';
    }

    const data = [];
    favorites.forEach((fav) => {
      const conjugation = conjugator.conjugate_one(
        stem,
        regular,
        isAdj,
        fav.honorific,
        fav.conjugationName,
      );

      if (conjugation) {
        data.push(ConjugationAPI.conjugationReducer(conjugation));
      }
    });

    return data;
  }

  fetchConjugationTypes(): string[] {
    return Array.from(conjugator.getTypes());
  }

  fetchConjugationNames(): string[] {
    return Array.from(conjugator.getNames());
  }

  fetchStems(query: string): string[] {
    const stems = stemmer.stem(query);
    if (query[query.length - 1] === '다') {
      stems.add(query); // in case query is already in infinitive form
    }
    return Array.from(stems);
  }

  static conjugationReducer(conjugation: RawConjugation): Conjugation {
    return {
      name: conjugation.conjugation_name,
      conjugation: conjugation.conjugated,
      type: conjugation.type,
      tense: conjugation.tense as Tense,
      speechLevel: conjugation.speechLevel as SpeechLevel,
      honorific: conjugation.honorific,
      pronunciation: conjugation.pronunciation,
      romanization: conjugation.romanized,
      reasons: conjugation.reasons,
    };
  }
}
