-- Description: Populate allergens and correct tags for all menu items (subtractive model)
-- Up
-- Migration script: set allergens and correct tags for all menu items
-- Generated from analysis of 342 production items
-- Date: 2026-07-08

BEGIN;

-- Jamón Gran Reserva y aceite de oliva
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 1;

-- Tortilla de patatas y tomate
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 2;

-- Pulled pork BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 3;

-- Pollo y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 4;

-- Carrillera al vino tinto
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 5;

-- Calamarcitos y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 6;

-- Pollo kebab y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 7;

-- Bacon ahumado y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 8;

-- Torreznos y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 9;

-- Lomo al ajillo y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 10;

-- Tortilla de patatas y queso madurado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,lactosa,pan,queso' WHERE id = 11;

-- Tortilla de patatas, bacon ahumado y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan' WHERE id = 12;

-- Tortilla de patatas, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 13;

-- Tortilla de patatas y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'spicy,vegetarian,without-lactose' WHERE id = 14;

-- Tortilla de patatas, patatas paja y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'special,vegetarian,without-lactose' WHERE id = 15;

-- Tortilla de patatas, cebolla crujiente y salsa BBQ
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 16;

-- Pollo y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 17;

-- Pollo, tomate y mojo picón
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 18;

-- Pollo, patatas paja y salsa de mostaza y miel
UPDATE menu_items SET allergens = 'carne,gluten,harina,miel,pan' WHERE id = 19;

-- Pollo, bacon ahumado y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 20;

-- Pollo, patatas paja y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 21;

-- Pollo kebab y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 22;

-- Pollo kebab y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 23;

-- Pollo kebab, tomate y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 24;

-- Pollo kebab, patatas paja y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 25;

-- Pollo kebab, bacon ahumado y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 26;

-- Pulled pork BBQ y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 27;

-- Pulled pork BBQ y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 28;

-- Pulled pork BBQ y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 29;

-- Pulled pork BBQ y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 30;

-- Pulled pork BBQ y cebolla crujiente
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 31;

-- Lomo al ajillo y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 32;

-- Lomo al ajillo y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 33;

-- Lomo al ajillo y mojo picón
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 34;

-- Lomo al ajillo, tomate y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 35;

-- Lomo al ajillo, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 36;

-- Lomo al ajillo, bacon ahumado y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 37;

-- Calamarcitos y salsa alioli
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 38;

-- Calamarcitos y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'special,without-lactose' WHERE id = 39;

-- Calamarcitos y guacamole
UPDATE menu_items SET allergens = 'gluten,harina,marisco,pan', tags = 'without-eggs,without-lactose' WHERE id = 40;

-- Calamarcitos, salsa brava y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'spicy,without-lactose' WHERE id = 41;

-- Calamarcitos, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 42;

-- Bacon ahumado, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 43;

-- Bacon ahumado, cebolla crujiente y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 44;

-- Bacon ahumado, tomate y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 45;

-- Bacon ahumado, patatas paja y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 46;

-- Bacon ahumado, tomate y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 47;

-- Jamón Gran Reserva y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso', tags = 'special,without-eggs' WHERE id = 48;

-- Jamón Gran Reserva y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 49;

-- Jamón Gran Reserva, tomate y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 50;

-- Jamón Gran Reserva y tortilla de patatas
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 51;

-- Carrillera al vino tinto y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 52;

-- Carrillera al vino tinto y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 53;

-- Carrillera al vino tinto y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 54;

-- Carrillera al vino tinto y cebolla crujiente
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 55;

-- Carrillera al vino tinto y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 56;

-- Torreznos y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 57;

-- Torreznos y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 58;

-- Torreznos y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 59;

-- Salmón ahumado y queso gorgonzola
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,pescado,queso' WHERE id = 60;

-- Salmón ahumado y tomate
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 61;

-- Salmón ahumado y salsa de mostaza y miel
UPDATE menu_items SET allergens = 'gluten,harina,miel,pan,pescado' WHERE id = 62;

-- Salmón ahumado y guacamole
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 63;

-- Chorizo parrillero y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 64;

-- Chorizo parrillero y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 65;

-- Chorizo parrillero y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 66;

-- Chorizo parrillero y guacamole
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 67;

-- Piadina de jamón cocido y queso mozzarella
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 71;

-- Piadina de pepperoni y queso mozzarella
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 72;

-- Piadina de pollo, tomate, queso mozzarella y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 73;

-- Piadina de jamón Gran Reserva, queso mozzarella y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso', tags = 'special,without-eggs' WHERE id = 74;

-- Piadina de jamón cocido, queso madurado y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 75;

-- Hotdog, kétchup y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'vegetarian,without-lactose' WHERE id = 76;

-- Hotdog, cebolla crujiente y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,pan', tags = 'spicy,vegan,vegetarian,without-eggs,without-lactose' WHERE id = 77;

-- Hotdog, guacamole y salsa cheddar
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 78;

-- Hotdog, patatas paja y salsa alioli
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'vegetarian,without-lactose' WHERE id = 79;

-- Hotdog, cebolla crujiente y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'special,vegetarian,without-lactose' WHERE id = 80;

-- Burger, queso madurado, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,lactosa,pan,queso', tags = 'vegetarian' WHERE id = 81;

-- Burger, queso madurado y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'spicy,vegetarian,without-eggs' WHERE id = 82;

-- Burger, guacamole y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 83;

-- Burger, bacon ahumado y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 84;

-- Burger, queso madurado y pepperoni
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 85;

-- BBQ — bacon, mozzarella, cebolla crujiente y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 86;

-- Pollo — pollo kebab, mozzarella, salsa pizza y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 87;

-- 3 Quesos — madurado, mozzarella, gorgonzola y orégano
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso' WHERE id = 88;

-- Pulled Pork — pulled pork, mozzarella, cebolla crujiente y BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 89;

-- Pepperoni — pepperoni, mozzarella, salsa pizza y orégano
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 90;

-- Tortilla de patatas, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 91;

-- Salmón ahumado y huevo hilado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado' WHERE id = 92;

-- Salmón ahumado y pintxo donostiarra
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 93;

-- Pintxo donostiarra y atún
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 94;

-- Pintxo donostiarra y huevo hilado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 95;

-- Jamón cocido, queso madurado y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso' WHERE id = 96;

-- Jamón cocido, queso madurado, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,lactosa,pan,queso', tags = '' WHERE id = 97;

-- Atún, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado', tags = 'without-lactose' WHERE id = 98;

-- Atún, huevo hilado y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado' WHERE id = 99;

-- Jamón Gran Reserva y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso', tags = 'special,without-eggs' WHERE id = 100;

-- Gildas (ud) - de boquerón
UPDATE menu_items SET allergens = 'pescado' WHERE id = 103;

-- Gildas (ud) - de anchoa
UPDATE menu_items SET allergens = 'pescado' WHERE id = 104;

-- Helado - cono
UPDATE menu_items SET allergens = 'gluten,harina', tags = 'vegan,vegetarian,without-eggs,without-lactose' WHERE id = 107;

-- Helado - sándwich
UPDATE menu_items SET allergens = 'gluten,harina,pan', tags = 'vegan,vegetarian,without-eggs,without-lactose' WHERE id = 108;

-- Añade extra bacon ahumado
UPDATE menu_items SET allergens = 'carne' WHERE id = 113;

-- Jamón Gran Reserva y aceite de oliva
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 115;

-- Tortilla de patatas y tomate
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 116;

-- Pulled pork BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 117;

-- Pollo y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 118;

-- Carrillera al vino tinto
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 119;

-- Calamarcitos y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 120;

-- Pollo kebab y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 121;

-- Bacon ahumado y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 122;

-- Torreznos y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 123;

-- Lomo al ajillo y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 124;

-- Tortilla de patatas y queso madurado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,lactosa,pan,queso' WHERE id = 125;

-- Tortilla de patatas, bacon ahumado y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan' WHERE id = 126;

-- Tortilla de patatas, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 127;

-- Tortilla de patatas y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'spicy,vegetarian,without-lactose' WHERE id = 128;

-- Tortilla de patatas, patatas paja y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'special,vegetarian,without-lactose' WHERE id = 129;

-- Tortilla de patatas, cebolla crujiente y salsa BBQ
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 130;

-- Pollo y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 131;

-- Pollo, tomate y mojo picón
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 132;

-- Pollo, patatas paja y salsa de mostaza y miel
UPDATE menu_items SET allergens = 'carne,gluten,harina,miel,pan' WHERE id = 133;

-- Pollo, bacon ahumado y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 134;

-- Pollo, patatas paja y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 135;

-- Pollo kebab y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 136;

-- Pollo kebab y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 137;

-- Pollo kebab, tomate y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 138;

-- Pollo kebab, patatas paja y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 139;

-- Pollo kebab, bacon ahumado y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 140;

-- Pulled pork BBQ y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 141;

-- Pulled pork BBQ y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 142;

-- Pulled pork BBQ y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 143;

-- Pulled pork BBQ y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 144;

-- Pulled pork BBQ y cebolla crujiente
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 145;

-- Lomo al ajillo y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 146;

-- Lomo al ajillo y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 147;

-- Lomo al ajillo y mojo picón
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 148;

-- Lomo al ajillo, tomate y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 149;

-- Lomo al ajillo, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 150;

-- Lomo al ajillo, bacon ahumado y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 151;

-- Calamarcitos y salsa alioli
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 152;

-- Calamarcitos y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'special,without-lactose' WHERE id = 153;

-- Calamarcitos y guacamole
UPDATE menu_items SET allergens = 'gluten,harina,marisco,pan', tags = 'without-eggs,without-lactose' WHERE id = 154;

-- Calamarcitos, salsa brava y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'spicy,without-lactose' WHERE id = 155;

-- Calamarcitos, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 156;

-- Bacon ahumado, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 157;

-- Bacon ahumado, cebolla crujiente y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 158;

-- Bacon ahumado, tomate y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 159;

-- Bacon ahumado, patatas paja y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 160;

-- Bacon ahumado, tomate y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 161;

-- Jamón Gran Reserva y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso', tags = 'special,without-eggs' WHERE id = 162;

-- Jamón Gran Reserva y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 163;

-- Jamón Gran Reserva, tomate y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 164;

-- Jamón Gran Reserva y tortilla de patatas
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 165;

-- Carrillera al vino tinto y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 166;

-- Carrillera al vino tinto y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 167;

-- Carrillera al vino tinto y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 168;

-- Carrillera al vino tinto y cebolla crujiente
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 169;

-- Carrillera al vino tinto y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 170;

-- Torreznos y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 171;

-- Torreznos y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 172;

-- Torreznos y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 173;

-- Salmón ahumado y queso gorgonzola
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,pescado,queso' WHERE id = 174;

-- Salmón ahumado y tomate
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 175;

-- Salmón ahumado y salsa de mostaza y miel
UPDATE menu_items SET allergens = 'gluten,harina,miel,pan,pescado' WHERE id = 176;

-- Salmón ahumado y guacamole
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 177;

-- Chorizo parrillero y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 178;

-- Chorizo parrillero y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 179;

-- Chorizo parrillero y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 180;

-- Chorizo parrillero y guacamole
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 181;

-- Piadina de jamón cocido y queso mozzarella
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 185;

-- Piadina de pepperoni y queso mozzarella
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 186;

-- Piadina de pollo, tomate, queso mozzarella y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 187;

-- Piadina de jamón Gran Reserva, queso mozzarella y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso', tags = 'special,without-eggs' WHERE id = 188;

-- Piadina de jamón cocido, queso madurado y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 189;

-- Hotdog, kétchup y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'vegetarian,without-lactose' WHERE id = 190;

-- Hotdog, cebolla crujiente y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,pan', tags = 'spicy,vegan,vegetarian,without-eggs,without-lactose' WHERE id = 191;

-- Hotdog, guacamole y salsa cheddar
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 192;

-- Hotdog, patatas paja y salsa alioli
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'vegetarian,without-lactose' WHERE id = 193;

-- Hotdog, cebolla crujiente y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'special,vegetarian,without-lactose' WHERE id = 194;

-- Burger, queso madurado, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,lactosa,pan,queso', tags = 'vegetarian' WHERE id = 195;

-- Burger, queso madurado y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'spicy,vegetarian,without-eggs' WHERE id = 196;

-- Burger, guacamole y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 197;

-- Burger, bacon ahumado y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 198;

-- Burger, queso madurado y pepperoni
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 199;

-- BBQ — bacon, mozzarella, cebolla crujiente y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 200;

-- Pollo — pollo kebab, mozzarella, salsa pizza y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 201;

-- 3 Quesos — madurado, mozzarella, gorgonzola y orégano
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso' WHERE id = 202;

-- Pulled Pork — pulled pork, mozzarella, cebolla crujiente y BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 203;

-- Pepperoni — pepperoni, mozzarella, salsa pizza y orégano
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 204;

-- Tortilla de patatas, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 205;

-- Salmón ahumado y huevo hilado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado' WHERE id = 206;

-- Salmón ahumado y pintxo donostiarra
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 207;

-- Pintxo donostiarra y atún
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 208;

-- Pintxo donostiarra y huevo hilado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 209;

-- Jamón cocido, queso madurado y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso' WHERE id = 210;

-- Jamón cocido, queso madurado, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,lactosa,pan,queso', tags = '' WHERE id = 211;

-- Atún, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado', tags = 'without-lactose' WHERE id = 212;

-- Atún, huevo hilado y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado' WHERE id = 213;

-- Jamón Gran Reserva y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso', tags = 'special,without-eggs' WHERE id = 214;

-- Gildas (ud) - de boquerón
UPDATE menu_items SET allergens = 'pescado' WHERE id = 217;

-- Gildas (ud) - de anchoa
UPDATE menu_items SET allergens = 'pescado' WHERE id = 218;

-- Helado - cono
UPDATE menu_items SET allergens = 'gluten,harina', tags = 'vegan,vegetarian,without-eggs,without-lactose' WHERE id = 221;

-- Helado - sándwich
UPDATE menu_items SET allergens = 'gluten,harina,pan', tags = 'vegan,vegetarian,without-eggs,without-lactose' WHERE id = 222;

-- Añade extra bacon ahumado
UPDATE menu_items SET allergens = 'carne' WHERE id = 227;

-- Jamón Gran Reserva y aceite de oliva
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 229;

-- Tortilla de patatas y tomate
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 230;

-- Pulled pork BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 231;

-- Pollo y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 232;

-- Carrillera al vino tinto
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 233;

-- Calamarcitos y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 234;

-- Pollo kebab y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 235;

-- Bacon ahumado y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 236;

-- Torreznos y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 237;

-- Lomo al ajillo y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 238;

-- Tortilla de patatas y queso madurado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,lactosa,pan,queso' WHERE id = 239;

-- Tortilla de patatas, bacon ahumado y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan' WHERE id = 240;

-- Tortilla de patatas, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 241;

-- Tortilla de patatas y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'spicy,vegetarian,without-lactose' WHERE id = 242;

-- Tortilla de patatas, patatas paja y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'special,vegetarian,without-lactose' WHERE id = 243;

-- Tortilla de patatas, cebolla crujiente y salsa BBQ
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 244;

-- Pollo y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 245;

-- Pollo, tomate y mojo picón
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 246;

-- Pollo, patatas paja y salsa de mostaza y miel
UPDATE menu_items SET allergens = 'carne,gluten,harina,miel,pan' WHERE id = 247;

-- Pollo, bacon ahumado y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 248;

-- Pollo, patatas paja y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 249;

-- Pollo kebab y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 250;

-- Pollo kebab y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 251;

-- Pollo kebab, tomate y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 252;

-- Pollo kebab, patatas paja y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 253;

-- Pollo kebab, bacon ahumado y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 254;

-- Pulled pork BBQ y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 255;

-- Pulled pork BBQ y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 256;

-- Pulled pork BBQ y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 257;

-- Pulled pork BBQ y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 258;

-- Pulled pork BBQ y cebolla crujiente
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 259;

-- Lomo al ajillo y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 260;

-- Lomo al ajillo y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 261;

-- Lomo al ajillo y mojo picón
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 262;

-- Lomo al ajillo, tomate y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 263;

-- Lomo al ajillo, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 264;

-- Lomo al ajillo, bacon ahumado y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 265;

-- Calamarcitos y salsa alioli
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 266;

-- Calamarcitos y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'special,without-lactose' WHERE id = 267;

-- Calamarcitos y guacamole
UPDATE menu_items SET allergens = 'gluten,harina,marisco,pan', tags = 'without-eggs,without-lactose' WHERE id = 268;

-- Calamarcitos, salsa brava y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'spicy,without-lactose' WHERE id = 269;

-- Calamarcitos, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,marisco,pan', tags = 'without-lactose' WHERE id = 270;

-- Bacon ahumado, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 271;

-- Bacon ahumado, cebolla crujiente y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 272;

-- Bacon ahumado, tomate y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 273;

-- Bacon ahumado, patatas paja y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 274;

-- Bacon ahumado, tomate y queso madurado
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 275;

-- Jamón Gran Reserva y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso', tags = 'special,without-eggs' WHERE id = 276;

-- Jamón Gran Reserva y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 277;

-- Jamón Gran Reserva, tomate y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan', tags = 'special,without-eggs,without-lactose' WHERE id = 278;

-- Jamón Gran Reserva y tortilla de patatas
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 279;

-- Carrillera al vino tinto y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 280;

-- Carrillera al vino tinto y patatas paja
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 281;

-- Carrillera al vino tinto y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 282;

-- Carrillera al vino tinto y cebolla crujiente
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 283;

-- Carrillera al vino tinto y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 284;

-- Torreznos y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 285;

-- Torreznos y salsa alioli
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'without-lactose' WHERE id = 286;

-- Torreznos y salsa 100M
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,pan', tags = 'special,without-lactose' WHERE id = 287;

-- Salmón ahumado y queso gorgonzola
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,pescado,queso' WHERE id = 288;

-- Salmón ahumado y tomate
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 289;

-- Salmón ahumado y salsa de mostaza y miel
UPDATE menu_items SET allergens = 'gluten,harina,miel,pan,pescado' WHERE id = 290;

-- Salmón ahumado y guacamole
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 291;

-- Chorizo parrillero y salsa brava
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 292;

-- Chorizo parrillero y queso gorgonzola
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 293;

-- Chorizo parrillero y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 294;

-- Chorizo parrillero y guacamole
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 295;

-- Piadina de jamón cocido y queso mozzarella
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 299;

-- Piadina de pepperoni y queso mozzarella
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 300;

-- Piadina de pollo, tomate, queso mozzarella y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 301;

-- Piadina de jamón Gran Reserva, queso mozzarella y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso', tags = 'special,without-eggs' WHERE id = 302;

-- Piadina de jamón cocido, queso madurado y tomate
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 303;

-- Hotdog, kétchup y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'vegetarian,without-lactose' WHERE id = 304;

-- Hotdog, cebolla crujiente y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,pan', tags = 'spicy,vegan,vegetarian,without-eggs,without-lactose' WHERE id = 305;

-- Hotdog, guacamole y salsa cheddar
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 306;

-- Hotdog, patatas paja y salsa alioli
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'vegetarian,without-lactose' WHERE id = 307;

-- Hotdog, cebolla crujiente y salsa 100M
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan', tags = 'special,vegetarian,without-lactose' WHERE id = 308;

-- Burger, queso madurado, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,lactosa,pan,queso', tags = 'vegetarian' WHERE id = 309;

-- Burger, queso madurado y mojo picón
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'spicy,vegetarian,without-eggs' WHERE id = 310;

-- Burger, guacamole y bacon ahumado
UPDATE menu_items SET allergens = 'carne,gluten,harina,pan' WHERE id = 311;

-- Burger, bacon ahumado y salsa cheddar
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 312;

-- Burger, queso madurado y pepperoni
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 313;

-- BBQ — bacon, mozzarella, cebolla crujiente y salsa BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 314;

-- Pollo — pollo kebab, mozzarella, salsa pizza y orégano
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 315;

-- 3 Quesos — madurado, mozzarella, gorgonzola y orégano
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso' WHERE id = 316;

-- Pulled Pork — pulled pork, mozzarella, cebolla crujiente y BBQ
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,pan,queso' WHERE id = 317;

-- Pepperoni — pepperoni, mozzarella, salsa pizza y orégano
UPDATE menu_items SET allergens = 'gluten,harina,lactosa,pan,queso', tags = 'vegetarian,without-eggs' WHERE id = 318;

-- Tortilla de patatas, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 319;

-- Salmón ahumado y huevo hilado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado' WHERE id = 320;

-- Salmón ahumado y pintxo donostiarra
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 321;

-- Pintxo donostiarra y atún
UPDATE menu_items SET allergens = 'gluten,harina,pan,pescado' WHERE id = 322;

-- Pintxo donostiarra y huevo hilado
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan' WHERE id = 323;

-- Jamón cocido, queso madurado y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso' WHERE id = 324;

-- Jamón cocido, queso madurado, tomate y mayonesa
UPDATE menu_items SET allergens = 'carne,gluten,harina,huevo,lactosa,pan,queso', tags = '' WHERE id = 325;

-- Atún, tomate y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado', tags = 'without-lactose' WHERE id = 326;

-- Atún, huevo hilado y mayonesa
UPDATE menu_items SET allergens = 'gluten,harina,huevo,pan,pescado' WHERE id = 327;

-- Jamón Gran Reserva y mantequilla
UPDATE menu_items SET allergens = 'carne,gluten,harina,lactosa,mantequilla,pan,queso', tags = 'special,without-eggs' WHERE id = 328;

-- Gildas (ud) - de boquerón
UPDATE menu_items SET allergens = 'pescado' WHERE id = 331;

-- Gildas (ud) - de anchoa
UPDATE menu_items SET allergens = 'pescado' WHERE id = 332;

-- Helado - cono
UPDATE menu_items SET allergens = 'gluten,harina', tags = 'vegan,vegetarian,without-eggs,without-lactose' WHERE id = 335;

-- Helado - sándwich
UPDATE menu_items SET allergens = 'gluten,harina,pan', tags = 'vegan,vegetarian,without-eggs,without-lactose' WHERE id = 336;

-- Añade extra bacon ahumado
UPDATE menu_items SET allergens = 'carne' WHERE id = 341;

COMMIT;

-- Down
-- To revert: UPDATE menu_items SET allergens = '', tags = (previous values);
-- This is destructive, so no automatic down script provided.
-- Restore tags from a backup if needed.