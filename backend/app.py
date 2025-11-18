from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import math
# flask = web app class 
# render_template = front end file loaders 
# request = for backend requests/apis/etc 
# jsonify = used for lists, maps. turn them into usable pieces for json apis

app = Flask(__name__)
CORS(app)

TYPE_CHART = {
    'normal': {'rock': 0.5, 'ghost': 0, 'steel': 0.5},
    'fire': {'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 2, 'bug': 2, 'rock': 0.5, 'dragon': 0.5, 'steel': 2},
    'water': {'fire': 2, 'water': 0.5, 'grass': 0.5, 'ground': 2, 'rock': 2, 'dragon': 0.5},
    'electric': {'water': 2, 'electric': 0.5, 'grass': 0.5, 'ground': 0, 'flying': 2, 'dragon': 0.5},
    'grass': {'fire': 0.5, 'water': 2, 'grass': 0.5, 'poison': 0.5, 'ground': 2, 'rock': 0.5},
    'ice': {'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 0.5, 'ground': 2, 'flying': 2, 'dragon': 2},
    'fighting': {'normal': 2, 'ice': 2, 'poison': 0.5, 'flying': 0.5, 'psychic': 0.5, 'bug': 0.5, 'rock': 2, 'ghost': 0, 'dark': 2, 'steel': 2, 'fairy': 0.5},
    'poison': {'grass': 2, 'poison': 0.5, 'ground': 0.5, 'rock': 0.5, 'ghost': 0.5, 'steel': 0, 'fairy': 2},
    'ground': {'fire': 2, 'electric': 2, 'grass': 0.5, 'poison': 2, 'flying': 0, 'bug': 0.5, 'rock': 2, 'steel': 2},
    'flying': {'electric': 0.5, 'grass': 2, 'fighting': 2, 'bug': 2, 'rock': 0.5, 'steel': 0.5},
    'psychic': {'fighting': 2, 'poison': 2, 'psychic': 0.5, 'dark': 0, 'steel': 0.5},
    'bug': {'fire': 0.5, 'grass': 2, 'fighting': 0.5, 'poison': 0.5, 'flying': 0.5, 'psychic': 2, 'ghost': 0.5, 'dark': 2, 'steel': 0.5, 'fairy': 0.5},
    'rock': {'fire': 2, 'ice': 2, 'fighting': 0.5, 'ground': 0.5, 'flying': 2, 'bug': 2, 'steel': 0.5},
    'ghost': {'normal': 0, 'psychic': 2, 'ghost': 2, 'dark': 0.5},
    'dragon': {'dragon': 2, 'steel': 0.5, 'fairy': 0},
    'dark': {'fighting': 0.5, 'psychic': 2, 'ghost': 2, 'dark': 0.5, 'fairy': 0.5},
    'steel': {'fire': 0.5, 'water': 0.5, 'electric': 0.5, 'ice': 2, 'rock': 2, 'steel': 0.5, 'fairy': 2},
    'fairy': {'fire': 0.5, 'fighting': 2, 'ground': 0.5, 'dragon': 2, 'dark': 2, 'steel': 0.5}
}

# How effective one attack is against another
def get_type_effectiveness(move_type, defender_type1, defender_type2=None): #some pokemon only have one typing
    """Calculate type effectivness multiplier"""
    #normal effectivness
    move_effectivness = 1.0
    if move_type in TYPE_CHART:
        if defender_type1 in TYPE_CHART[move_type]:
            move_effectivness *= TYPE_CHART[move_type][defender_type1]
        if defender_type2 and defender_type2 in TYPE_CHART[move_type]:
            move_effectivness *= TYPE_CHART[move_type][defender_type2]
    return move_effectivness


def damage_calc(attacker, defender, move, field_condition):
    """     Pokemon Damage Formula:
            Damage = ((2 * Level / 5 + 2) * Power * A / D / 50 + 2) * Modifiers     """
    level = attacker['level']
    power = move['power']

    # determine if move is physical or special
    if move['category'] == 'physical':
        attack = attacker['attack']
        defense = defender['defense']
    else:
        attack = attacker['sp_atk']
        defense = defender['sp_def']

    attack = max(1, attack)
    defense = max(1, defense)

    modifiers = 1.0

    base_damage = (((2 * level / 5 + 2) * power * attack / defense) / 50 + 2) * modifiers

    # STAB (Same Type Attack Bonus)
    stab = 1.0
    if attacker['type1'] == move['type'] or move['type'] == attacker.get('type2'):
        stab = 1.5
        if attacker.get('ability', '').lower() == 'adaptability':
            stab = 2.0
    # Type effectivness
    effectivness = get_type_effectiveness(move['type'], defender['type1'], defender.get('type2')) # second type isn't always there. Some pokemon are MONO-type

    # Weather Modifiers
    weather_mod = 1.0
    if field_condition.get('weather'):
        weather = field_condition['weather']
        if weather == 'sun' and move['type'] == 'fire':
            weather_mod = 1.5
        elif weather == 'sun' and move['type'] == 'water':
            weather_mod = 0.5
        elif weather == 'rain' and move['type'] == 'water':
            weather_mod = 1.5
        elif weather == 'rain' and move['type'] == 'fire':
            weather_mod = 0.5

    # Critical Hits
    crit_mod = 1.0
    if move.get('crit', False):
        crit_mod = 1.5

    # Item Modifiers
    item_mod = 1.0
    if attacker.get('item'):
        item = attacker['item'].lower()
        if 'choice band' in item and move['category'] == 'physical':
            item_mod = 1.5
        elif 'choice specs' in item and move['category'] == 'special':
            item_mod = 1.5
        elif 'life orb' in item:
            item_mod = 1.3
    
    final_mod = item_mod * weather_mod * stab * effectivness * crit_mod

    # Pokemons random factor
    min_damage = math.floor(base_damage * final_mod * 0.85) #math.floor, rounds down to nearest whole number
    max_damage = math.floor(base_damage * final_mod * 1.0)

    return{
        'min': max(1, min_damage),
        'max': max(1, max_damage),
        'effectivness': effectivness,
        'stab': stab > 1.0,
        'crit': crit_mod > 1.0
    }

def calculate_speed_order(p1, p2, fc):
    """Determining which pokemon moves first"""
    speed1 = p1['speed']
    speed2 = p2['speed']

    #tailwind
    if fc.get('tailwind'):
        if fc.get('tailwind') == 'p1':
            s1 *= 2
        elif fc.get('tailwind') == 'p2':
            s2 *= 2
    
    # Trick Room reverses speed
    if fc.get('trick_room'):
        return speed1 < speed2 # lower speed wins
    
    return speed1 > speed2 # higher speed wins


def simulate_battle(pokemon1, pokemon2, field_condition):
    
    #Pokemon Moves for calculation
    move1 = {
        'name': pokemon1.get('move_name', 'Attack'), 
        'type': pokemon1['move_type'],
        'category': pokemon1['move_category'],
        'crit': False,
        'power': pokemon1.get('move_power', 80)
    }

    move2 = {
        'name': pokemon2.get('move_name', 'Attack'),
        'type': pokemon2['move_type'],
        'category': pokemon2['move_category'],
        'crit': False,
        'power': pokemon2.get('move_power', 80)
    }

    #damage calc
    damage_p1_to_p2 = damage_calc(pokemon1, pokemon2, move1, field_condition)
    damage_p2_to_p1 = damage_calc(pokemon2, pokemon1, move2, field_condition)

    #speed calc
    which_faster = calculate_speed_order(pokemon1, pokemon2, field_condition)

    #calc OHKO
    p1_hp = pokemon1['hp']
    p2_hp = pokemon2['hp']

    p1_ohko = (damage_p1_to_p2['max'] >= p2_hp)
    p2_ohko = (damage_p2_to_p1['max'] >= p1_hp)

    # Win probability estimation
    p1_win_prob = 50
    if p1_ohko and which_faster:
        p1_win_prob = 95
    elif p2_ohko and not which_faster:
        p1_win_prob = 5
    else:
        # Damage ratio comparison
        damage_ratio = (damage_p1_to_p2['max'] / p2_hp) / (damage_p2_to_p1['max'] / p1_hp)
        p1_win_prob = min(95, max(5, 50 + (damage_ratio - 1) * 30))
        
        if which_faster:
            p1_win_prob += 10
    return {
    'pokemon1_damage': damage_p1_to_p2,
    'pokemon2_damage': damage_p2_to_p1,
    'pokemon1_faster': which_faster,
    'pokemon1_win': round(p1_win_prob, 1),
    'pokemon2_win': round(100 - p1_win_prob, 1),
    'pokemon1_ohko': p1_ohko,
    'pokemon2_ohko': p2_ohko
    }

@app.route('/')
def home():
    return "Pokemon Battle Calculator Backend Running"

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json

    pokemon1 = data['pokemon1']
    pokemon2 = data['pokemon2']
    field_condition = data.get('fieldConditions', {})

    results = simulate_battle(pokemon1, pokemon2, field_condition)

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
