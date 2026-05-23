const { normalize } = require('./routeUtils');

const includesNormalized = (list, value) => list.some((entry) => normalize(entry) === value);

const buildTypeMap = (typesData) => new Map(
  typesData.map((type) => [normalize(type.english), type]),
);

const getMultiplier = (typeMap, atkType, defType) => {
  const attacker = typeMap.get(normalize(atkType));
  if (!attacker) return null;
  const defender = normalize(defType);

  if (includesNormalized(attacker.no_effect || [], defender)) return 0;
  if (includesNormalized(attacker.effective || [], defender)) return 2;
  if (includesNormalized(attacker.ineffective || [], defender)) return 0.5;
  return 1;
};

const getCombinedMultiplier = (typeMap, atkType, defTypes) => defTypes
  .map((defType) => getMultiplier(typeMap, atkType, defType))
  .reduce((total, value) => {
    if (total === null || value === null) return null;
    return total * value;
  }, 1);

const getEffectivenessLabel = (multiplier) => {
  if (multiplier === 0) return 'no effect';
  if (multiplier < 1) return 'not very effective';
  if (multiplier > 1) return 'super effective';
  return 'normal';
};

const getPokemonDefensiveProfile = (typeMap, pokemonTypes) => {
  const defendingTypes = pokemonTypes.map(normalize);
  const weaknesses = [];
  const resistances = [];
  const immunities = [];

  typeMap.forEach((type) => {
    const multiplier = getCombinedMultiplier(typeMap, type.english, defendingTypes);
    if (multiplier === null) return;

    if (multiplier === 0) {
      immunities.push({ type: type.english, multiplier });
    } else if (multiplier < 1) {
      resistances.push({ type: type.english, multiplier });
    } else if (multiplier > 1) {
      weaknesses.push({ type: type.english, multiplier });
    }
  });

  return {
    weaknesses,
    resistances,
    immunities,
  };
};

module.exports = {
  buildTypeMap,
  getMultiplier,
  getCombinedMultiplier,
  getEffectivenessLabel,
  getPokemonDefensiveProfile,
};
