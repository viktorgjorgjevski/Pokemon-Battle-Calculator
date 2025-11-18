import React, { useState } from 'react';
import './App.css';
import { API_URL } from "./config";

interface PokemonStats {
  level: number;
  ability: string;
  type1: string;
  type2: string;
  hp: number;
  attack: number;
  defense: number;
  sp_def: number;
  sp_atk: number;
  speed: number;
  item: string;
  condition: string;
  move_type: string;
  move_category: string;
  move_power: number;
}

interface FieldConditions {
  weather: string;
  effects: string;
  hazards: string;
}

interface DamageResult {
  min: number;
  max: number;
  stab: boolean;
  crit: boolean;
  effectiveness: number;
}

interface BattleResults {
  pokemon1_damage: DamageResult;
  pokemon2_damage: DamageResult;
  pokemon1_faster: boolean;
  pokemon1_OHKO: boolean;
  pokemon2_OHKO: boolean;
  pokemon1_win: number;
  pokemon2_win: number;
}

const TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

const App: React.FC = () => {
  const [pokemon1, setPokemon1] = useState<PokemonStats>({
    level: 50,
    ability: '',
    type1: 'normal',
    type2: '',
    hp: 150,
    attack: 100,
    defense: 100,
    sp_atk: 100,
    sp_def: 100,
    speed: 100,
    item: '',
    condition: '',
    move_type: 'normal',
    move_category: 'physical',
    move_power: 80,
  });

  const [pokemon2, setPokemon2] = useState<PokemonStats>({
    level: 50,
    ability: '',
    type1: 'normal',
    type2: '',
    hp: 150,
    attack: 100,
    defense: 100,
    sp_atk: 100,
    sp_def: 100,
    speed: 100,
    item: '',
    condition: '',
    move_type: 'normal',
    move_category: 'physical',
    move_power: 80,
  });

  const [fieldConditions, setFieldConditions] = useState<FieldConditions>({
    weather: '',
    hazards: '',
    effects: '',
  });

  const [results, setResults] = useState<BattleResults | null>(null);
  const [loading, setLoading] = useState(false);

  const updatePokemon1 = (field: keyof PokemonStats, value: string | number) => {
    setPokemon1((prev) => ({ ...prev, [field]: value }));
  };

  const updatePokemon2 = (field: keyof PokemonStats, value: string | number) => {
    setPokemon2((prev) => ({ ...prev, [field]: value }));
  };

  const calculateBattle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pokemon1: {
            ...pokemon1,
            type2: pokemon1.type2 || null,
          },
          pokemon2: {
            ...pokemon2,
            type2: pokemon2.type2 || null,
          },
          fieldConditions: {
            weather: fieldConditions.weather,
            hazards: fieldConditions.hazards,
            trickroom: fieldConditions.effects === 'trick_room',
            tailwind: fieldConditions.effects.includes('tailwind')
              ? fieldConditions.effects.split('_')[1]
              : null,
          },
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error calculating battle:', error);
      alert('Error connecting to backend. Make sure Flask server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const getEffectivenessText = (multiplier: number): string => {
    if (multiplier > 1) return 'Super Effective';
    if (multiplier == 1) return 'Neutral';
    if (multiplier < 1 && multiplier > 0) return 'Not Very Effective';
    return 'No Effect';
  };

  const getEffectivenessColor = (multiplier: number): string => {
    if (multiplier > 1) return '#16a34a';
    if (multiplier === 1) return '#6b7280';
    if (multiplier > 0) return '#f97316';
    return '#374151';
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Pokémon Battle Calculator</h1>
        <span className="version-tag">v1.0</span>
      </header>

      <div className="field-chips">
        <h2>Field Chips</h2>
        <div className="field-row">
          <div className="field-group">
            <label>Weather</label>
            <select
              value={fieldConditions.weather}
              onChange={(e) => setFieldConditions((prev) => ({ ...prev, weather: e.target.value }))}
            >
              <option value="">None</option>
              <option value="sun">Sun</option>
              <option value="rain">Rain</option>
              <option value="sand">Sandstorm</option>
              <option value="hail">Hail</option>
            </select>
          </div>
          <div className="field-group">
            <label>Hazards</label>
            <select
              value={fieldConditions.hazards}
              onChange={(e) => setFieldConditions((prev) => ({ ...prev, hazards: e.target.value }))}
            >
              <option value="">None</option>
              <option value="stealth_rock">Stealth Rock</option>
              <option value="spikes">Spikes</option>
              <option value="toxic_spikes">Toxic Spikes</option>
            </select>
          </div>
          <div className="field-group">
            <label>Effects</label>
            <select
              value={fieldConditions.effects}
              onChange={(e) => setFieldConditions((prev) => ({ ...prev, effects: e.target.value }))}
            >
              <option value="">None</option>
              <option value="trick_room">Trick Room</option>
              <option value="tailwind_p1">Tailwind (P1)</option>
              <option value="tailwind_p2">Tailwind (P2)</option>
            </select>
          </div>
          <button
            className="clear-btn"
            onClick={() => setFieldConditions({ weather: '', hazards: '', effects: '' })}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="battle-container">
        <PokemonPanel title="Pokémon 1" pokemon={pokemon1} updatePokemon={updatePokemon1} />

        <div className="center-panel">
          <button className="calculate-btn" onClick={calculateBattle} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate'}
          </button>

          {results ? (
            <ResultsPanel
              results={results}
              pokemon1={pokemon1}
              pokemon2={pokemon2}
              getEffectivenessText={getEffectivenessText}
              getEffectivenessColor={getEffectivenessColor}
            />
          ) : (
            <div className="results-placeholder">
              <p>Hit "Calculate" to see Damage, OHKO %, Speed, and Type analysis.</p>
            </div>
          )}
        </div>

        <PokemonPanel title="Pokémon 2" pokemon={pokemon2} updatePokemon={updatePokemon2} />
      </div>
    </div>
  );
};

interface PokemonPanelProps {
  title: string;
  pokemon: PokemonStats;
  updatePokemon: (field: keyof PokemonStats, value: number | string) => void;
}

const PokemonPanel: React.FC<PokemonPanelProps> = ({ title, pokemon, updatePokemon }) => {
  return (
    <div className="pokemon-panel">
      <div className="panel-header">{title}</div>

      <div className="input-group">
        <label>Level</label>
        <input
          type="number"
          value={pokemon.level}
          onChange={(e) => updatePokemon('level', parseInt(e.target.value))}
          min="1"
          max="100"
        />
      </div>

      <div className="input-group">
        <label>Ability</label>
        <input
          type="text"
          value={pokemon.ability}
          onChange={(e) => updatePokemon('ability', e.target.value)}
          placeholder="e.g., Intimidate"
        />
      </div>

      <div className="type-row">
        <div className="type-input">
          <label>Type 1</label>
          <select value={pokemon.type1} onChange={(e) => updatePokemon('type1', e.target.value)}>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="type-input">
          <label>Type 2</label>
          <select value={pokemon.type2} onChange={(e) => updatePokemon('type2', e.target.value)}>
            <option value="">None</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="input-group">
        <label>HP</label>
        <input value={pokemon.hp} onChange={(e) => updatePokemon('hp', parseInt(e.target.value))} />
      </div>

      <div className="input-group">
        <label>Attack</label>
        <input
          value={pokemon.attack}
          onChange={(e) => updatePokemon('attack', parseInt(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Defense</label>
        <input
          value={pokemon.defense}
          onChange={(e) => updatePokemon('defense', parseInt(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Sp. Atk</label>
        <input
          value={pokemon.sp_atk}
          onChange={(e) => updatePokemon('sp_atk', parseInt(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Sp. Def</label>
        <input
          value={pokemon.sp_def}
          onChange={(e) => updatePokemon('sp_def', parseInt(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Speed</label>
        <input
          value={pokemon.speed}
          onChange={(e) => updatePokemon('speed', parseInt(e.target.value))}
        />
      </div>

      <div className="move-section">
        <h3>Move</h3>

        <div className="input-group">
          <label>Type</label>
          <select value={pokemon.move_type} onChange={(e) => updatePokemon('move_type', e.target.value)}>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Category</label>
          <select
            value={pokemon.move_category}
            onChange={(e) => updatePokemon('move_category', e.target.value)}
          >
            <option value="physical">Physical</option>
            <option value="special">Special</option>
          </select>
        </div>

        <div className="input-group">
          <label>Power</label>
          <input
            type="number"
            value={pokemon.move_power}
            onChange={(e) => updatePokemon('move_power', parseInt(e.target.value))}
            min="1"
          />
        </div>

        <div className="input-group">
          <label>Item</label>
          <input
            value={pokemon.item}
            onChange={(e) => updatePokemon('item', e.target.value)}
            placeholder="e.g., Life Orb"
          />
        </div>

        <div className="input-group">
          <label>Condition</label>
          <input
            value={pokemon.condition}
            onChange={(e) => updatePokemon('condition', e.target.value)}
            placeholder="e.g., Burned"
          />
        </div>
      </div>
    </div>
  );
};

interface ResultsPanelProps {
  results: BattleResults;
  pokemon1: PokemonStats;
  pokemon2: PokemonStats;
  getEffectivenessText: (multiplier: number) => string;
  getEffectivenessColor: (multiplier: number) => string;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  pokemon1,
  pokemon2,
  getEffectivenessText,
  getEffectivenessColor,
}) => {
  const p1DamagePercent = (results.pokemon2_damage.max / pokemon1.hp) * 100;
  const p2DamagePercent = (results.pokemon1_damage.max / pokemon2.hp) * 100;

  return (
    <div className="results-panel">
      <h2>Battle Results</h2>
      <div className="damage-table">
        <div className="damage-row">
          <strong>P1 → P2 Damage</strong>
          <span>
            {results.pokemon1_damage.min} - {results.pokemon1_damage.max}
          </span>
        </div>
        <div className="damage-row">
          <strong>P2 → P1 Damage</strong>
          <span>
            {results.pokemon2_damage.min} - {results.pokemon2_damage.max}
          </span>
        </div>
        <div className="damage-row">
          <strong>Speed Winner</strong>
          <span>{results.pokemon1_faster ? 'Pokémon 1' : 'Pokémon 2'}</span>
        </div>
        <div className="damage-row">
          <strong>P1 OHKO</strong>
          <span className={results.pokemon1_OHKO ? 'text-green' : 'text-red'}>
            {results.pokemon1_OHKO ? 'Yes ✓' : 'No ✗'}
          </span>
        </div>
        <div className="damage-row">
          <strong>P2 OHKO</strong>
          <span className={results.pokemon2_OHKO ? 'text-green' : 'text-red'}>
            {results.pokemon2_OHKO ? 'Yes ✓' : 'No ✗'}
          </span>
        </div>
      </div>

      <div className="hp-visualization">
        <div className="hp-section">
          <strong>Pokémon 1 HP Remaining</strong>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${Math.max(0, 100 - p1DamagePercent)}%` }} />
          </div>
          <div className="hp-text">
            {Math.max(0, pokemon1.hp - results.pokemon2_damage.max)} / {pokemon1.hp} HP
          </div>
        </div>

        <div className="hp-section">
          <strong>Pokémon 2 HP Remaining</strong>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${Math.max(0, 100 - p2DamagePercent)}%` }} />
          </div>
          <div className="hp-text">
            {Math.max(0, pokemon2.hp - results.pokemon1_damage.max)} / {pokemon2.hp} HP
          </div>
        </div>
      </div>

      <div className="effectiveness-display">
        <div className="effectiveness-row">
          <strong>Pokémon 1's Move:</strong>
          <span
            className="effectiveness-tag"
            style={{ backgroundColor: getEffectivenessColor(results.pokemon1_damage.effectiveness) }}
          >
            {getEffectivenessText(results.pokemon1_damage.effectiveness)}
          </span>
          {results.pokemon1_damage.stab && <span className="effectiveness-tag stab-tag">STAB</span>}
        </div>
        <div className="effectiveness-row">
          <strong>Pokémon 2's Move:</strong>
          <span
            className="effectiveness-tag"
            style={{ backgroundColor: getEffectivenessColor(results.pokemon2_damage.effectiveness) }}
          >
            {getEffectivenessText(results.pokemon2_damage.effectiveness)}
          </span>
          {results.pokemon2_damage.stab && <span className="effectiveness-tag stab-tag">STAB</span>}
        </div>
      </div>

      <div className="win-probability">
        <div className="win-row">
          <span>Pokémon 1 Win Probability:</span>
          <span className="win-percent p1">{results.pokemon1_win}%</span>
        </div>
        <div className="win-row">
          <span>Pokémon 2 Win Probability:</span>
          <span className="win-percent p2">{results.pokemon2_win}%</span>
        </div>
      </div>

      <div className="explanation-box">
        <h3>Battle Analysis</h3>
        <p>
          <strong>Speed:</strong> {results.pokemon1_faster ? 'Pokémon 1' : 'Pokémon 2'} moves first with{' '}
          {results.pokemon1_faster ? pokemon1.speed : pokemon2.speed} speed.
        </p>
        <p>
          <strong>Type Matchup:</strong> Pokémon 1's attack is{' '}
          {getEffectivenessText(results.pokemon1_damage.effectiveness).toLowerCase()}, while Pokémon 2's attack is{' '}
          {getEffectivenessText(results.pokemon2_damage.effectiveness).toLowerCase()}.
        </p>
        {(results.pokemon1_OHKO || results.pokemon2_OHKO) && (
          <p className="text-warning">
            <strong>⚠ OHKO Detected:</strong>{' '}
            {results.pokemon1_OHKO && 'Pokémon 1 can KO in one hit. '}
            {results.pokemon2_OHKO && 'Pokémon 2 can KO in one hit.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default App;
