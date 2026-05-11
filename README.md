# Öxyd StageBook

App web/prototip pensada per a mòbil i tauleta per organitzar partitures, lletres i repertoris de concert.

## Què inclou aquesta versió

- Importació d'arxius PDF, imatges i textos.
- Biblioteca local guardada al dispositiu amb IndexedDB.
- Creació de llistes/repertoris per concerts, assajos o bolos.
- Visualització a pantalla completa amb botons d'anterior i següent.
- Mode fosc d'escenari amb disseny inspirat en el logo d'Öxyd.
- Logo d'Öxyd integrat a la pantalla inicial, capçalera, colors i icones PWA.
- Reordenació millorada dins de cada llista:
  - arrossegar amb la icona ☰;
  - auto-scroll quan arrossegues cap a la part superior o inferior de la pantalla;
  - botons ràpids ⤒ ↑ ↓ ⤓ per moure una cançó al principi, pujar, baixar o enviar al final.

## Ús bàsic

1. Obre `index.html` al navegador.
2. Importa les cançons des de la pantalla inicial o des de Biblioteca.
3. Ves a Llistes i crea un repertori nou.
4. Afegeix cançons de la biblioteca.
5. Reordena-les amb arrossegar o amb els botons de moviment.
6. Prem **Tocar** per obrir el repertori en mode pantalla completa.

## Publicar a GitHub Pages

1. Crea un repositori nou a GitHub.
2. Puja tots els arxius d'aquesta carpeta, no el ZIP sencer.
3. Ves a **Settings > Pages**.
4. A **Branch**, selecciona `main` i carpeta `/root`.
5. Desa i espera que GitHub generi l'enllaç.

## Notes importants

- Els arxius importats es guarden al navegador/dispositiu. Si canvies de mòbil o navegador, hauràs d'importar-los de nou.
- La funció de compartir llista exporta l'estructura del repertori, però no adjunta automàticament els PDF o imatges.
- Per a escenari, és recomanable usar PDF o imatges perquè es visualitzen millor.


## Millores afegides a la versió Öxyd

- Identitat visual Öxyd amb logo símbol i logo complet.
- Reordenació millorada dins les llistes: auto-scroll mentre arrossegues i botons ràpids per moure cançons.
- Mode fosc del visor: dins una cançó o partitura pots tocar el botó "◐" i canviar a una lectura amb fons negre i lletres clares / colors invertits per a escenari.


## Exportar i importar repertoris complets

Aquesta versió permet crear un fitxer `.stagebook` amb el repertori complet:

- nom de la llista;
- ordre exacte de les cançons;
- PDFs, imatges o textos inclosos dins del mateix arxiu;
- importació directa en un altre dispositiu.

Això permet preparar un concert en un ordinador i passar-lo a una tauleta o compartir-lo amb altres membres del grup sense haver d’importar els PDFs un a un. Dins d’una llista, prem **Exportar repertori**. A l’altre dispositiu, prem **Importar repertori** i selecciona el fitxer `.stagebook`.


## Versió v5 - repertori Öxyd precarregat

Aquesta versió inclou dins l’app el repertori de concert d’Öxyd amb els PDFs disponibles. Quan l’app s’obre per primera vegada, crea automàticament la llista **“Setlist2026”** i afegeix les cançons a la biblioteca.

També es mantenen els botons per:

- importar més PDFs, imatges o textos;
- crear llistes noves;
- reordenar cançons;
- exportar repertoris;
- importar repertoris `.stagebook` o `.json`.

Nota: en alguns mòbils els fitxers `.stagebook` poden no aparèixer al selector de documents. Per això aquesta versió ja porta el repertori base integrat.


## Versió v5

Afegeix el PDF precarregat **BIENVENIDOS AL VALHALLA 170bpm**, deixant el repertori de concert d’Öxyd amb 14 PDFs.


## Versió final neta

Aquesta versió deixa una sola llista precarregada anomenada **Setlist2026**, amb els 14 PDFs. No inclou l’arxiu **Cornivella.stagebook** ni cap llista de prova anomenada **Assaig**.


## Versió v7 final neta

Correcció final: només queda una llista inicial anomenada **Setlist2026**, amb els 14 PDFs. S'elimina automàticament qualsevol dada antiga de prova com **Assaig**, **Cornudella/Cornivella** o fitxers `.stagebook` carregats per error a la biblioteca.
