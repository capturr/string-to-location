/*----------------------------------
- DEPENDANCES
----------------------------------*/

// Import deps
import fs from 'fs-extra';
import path from 'path';
import cities from 'all-the-cities';

// Ap
import { normalizeCityName } from '../src/utils';

// Load countries list
const countries = fs.readJsonSync( path.resolve(__dirname, './countries+states+cities.json' )) as {
    iso2: string,
    iso3: string,
    name: string
}[]

/*----------------------------------
- CONST
----------------------------------*/

// Confoig
const config = {
    minPopulation: 10000,
    replace: {
        'New York City': 'New York',
    }
}

/*----------------------------------
- GENERATE
----------------------------------*/

const countriesIndex: { 
    [iso: string]: {
        name: string,
        iso2: string,
        iso3: string,
        population: number,
        cities: {
            name: string,
            population: number,
        }[]
    }
} = {};

// 1. Index countries by iso code
for (const country of countries) {
    countriesIndex[ country.iso2 ] = {
        name: country.name,
        iso2: country.iso2,
        iso3: country.iso3,
        population: 0,
        cities: []
    }
}

// 2. Assign cities to countries
let countriesNotFound: string[] = [];
for (const city of cities) {

    // Minimum population
    if (city.population < config.minPopulation)
        continue;

    // Check if country found
    const country = countriesIndex[ city.country ];
    if (!country) {
        countriesNotFound.push( city.country );
        continue;
    }

    // Replace name
    if (city.name in config.replace)
        city.name = config.replace[ city.name ];

    // Index city
    country.population += city.population;
    country.cities.push({
        name: city.name,
        population: city.population
    });
}

// 3. Sort by population size
const countriesList = Object.values( countriesIndex ).sort((a, b) => b.population - a.population);
for (const country of countriesList) {
    country.cities.sort((a, b) => b.population - a.population);
}

// 4. Write output
fs.outputFileSync( path.resolve(__dirname, '../src/countries.generated.ts'), 
'export default [' + countriesList.map( country => `{
    name: ${JSON.stringify(country.name)},
    keywords: ${JSON.stringify( normalizeCityName(country.name ))},
    iso2: '${country.iso2}',
    iso3: '${country.iso3}',
    pop: ${country.population},
    cities: [${country.cities.map( city => `{ 
        name: ${JSON.stringify(city.name)}, 
        keywords: ${JSON.stringify( normalizeCityName(city.name ))},
        pop: ${city.population} 
    }`).join(',')}]
}`).join(',\n') + ']');
