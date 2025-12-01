# Next Editor

A text editor focused on book and eBook writers.
With chapter and paragraph management and AI integration for:
- Character construction and arcs
- Rewriting for compatibility with your own style or others
- Detecting redundant themes
- Checking for grammatical errors
- Tips and tricks for writers

## Components:

- Title[Subtitle] -> Chapter[ ChapterTitle -> [Paragraph[Text] ...]]

### Title/Subtitle
The main title with an optional subtitle.
Commands:
    1a - Insert the main title -> [TAB] insert the subtitle -> [ENTER]
    1b - Insert the main title -> [ENTER]
    3 - Create the first chapter and the first paragraph (if they do not exist)
    4 - [Right-click] -> Edit content -> click outside the component or press [ENTER] to finish editing.

### Chapter
The chapter.
Buttons: 
- Remove Chapter
- Resume Chapter
- Check Grammatical Corrections (On/Off). Default: On when the chapter is focused (selected)

### Paragraph
The paragraph.
Commands:
- [CTRL+ENTER] -> New Paragraph
- [Up/Down Arrow keys] -> Go to the previous/next paragraph if you are on the first or last line, and if a previous/next paragraph exists.
- Empty paragraph -> [ESC] -> Remove paragraph

## Write Flow Guide:
- Add title -> [TAB] or [AddSubButton] -> Add subtitle -> [ENTER] or [OK Button]
- Create a new chapter if one does not exist
- New chapter -> Add title -> [TAB] or [AddSubButton] -> Add subtitle -> [ENTER] or [OK Button]
- Create a new paragraph (if none exists)
- With a new paragraph selected -> [ENTER] -> New paragraph -> Write.
- New paragraph -> [CTRL+ENTER] -> New line in the same paragraph
- No paragraph selected -> [Right-click] -> Edit paragraph
- Edit paragraph -> [ENTER] or [OK Button] -> Finish editing.
- Click the [---] button to drag and drop paragraphs to reorder.
- On/Off [Focus Mode] button to hide all controls. Press [F1] to show them again for 3 seconds.

## Getting Started

First, run mongoDB container:
`docker compose -f .docker/docker-compose.yml up -d`

To stop:
`docker compose -f .docker/docker-compose.yml down`

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
