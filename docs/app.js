(function () {
  const STORAGE_KEYS = {
    favorites: "fitness_randomizer_favorites_v1",
    settings: "fitness_randomizer_settings_v1",
    imageCache: "fitness_randomizer_image_cache_v2"
  };

  const exercises = EXERCISES.map((exercise, index) => ({
    id: `ex-${index + 1}`,
    ...exercise
  }));
  const IMAGE_QUERY_OVERRIDES = {
    "Back Squat": ["barbell back squat exercise", "squat form gym"],
    "Barbell Bench Press": ["barbell bench press exercise", "bench press gym"],
    "Conventional Deadlift": ["barbell deadlift exercise", "deadlift form gym"],
    "Pull-Up": ["pull up exercise", "pull up bar gym"],
    "Overhead Press": ["barbell overhead press exercise", "shoulder press barbell"],
    "Romanian Deadlift": ["romanian deadlift exercise", "rdl gym form"]
  };

  const state = {
    activeTab: "library",
    favorites: new Set(loadArray(STORAGE_KEYS.favorites)),
    settings: loadSettings(),
    generatedWorkout: [],
    imageCache: loadObject(STORAGE_KEYS.imageCache),
    pendingImageLookups: new Set()
  };

  const elements = {
    tabs: document.querySelectorAll(".tab-button"),
    libraryTab: document.getElementById("library-tab"),
    generatorTab: document.getElementById("generator-tab"),
    searchInput: document.getElementById("search-input"),
    libraryFavoritesOnly: document.getElementById("library-favorites-only"),
    libraryEquipmentFilters: document.getElementById("library-equipment-filters"),
    libraryBodyareaFilters: document.getElementById("library-bodyarea-filters"),
    exerciseCount: document.getElementById("exercise-count"),
    exerciseList: document.getElementById("exercise-list"),
    countInput: document.getElementById("count-input"),
    minSetsInput: document.getElementById("min-sets-input"),
    maxSetsInput: document.getElementById("max-sets-input"),
    minRepsInput: document.getElementById("min-reps-input"),
    maxRepsInput: document.getElementById("max-reps-input"),
    generatorFavoritesOnly: document.getElementById("generator-favorites-only"),
    generatorEquipmentFilters: document.getElementById("generator-equipment-filters"),
    generatorBodyareaFilters: document.getElementById("generator-bodyarea-filters"),
    generateButton: document.getElementById("generate-button"),
    generatedWorkout: document.getElementById("generated-workout")
  };

  initialize();

  function initialize() {
    hydrateInputsFromSettings();
    wireEvents();
    renderFilters();
    renderExerciseList();
    renderGeneratedWorkout();
  }

  function wireEvents() {
    elements.tabs.forEach((tabButton) => {
      tabButton.addEventListener("click", () => switchTab(tabButton.dataset.tab));
    });

    elements.searchInput.addEventListener("input", (event) => {
      state.settings.library.searchText = event.target.value;
      persistSettings();
      renderExerciseList();
    });

    elements.libraryFavoritesOnly.addEventListener("change", (event) => {
      state.settings.library.favoritesOnly = event.target.checked;
      persistSettings();
      renderExerciseList();
    });

    elements.countInput.addEventListener("change", onGeneratorSettingsChange);
    elements.minSetsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.maxSetsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.minRepsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.maxRepsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.generatorFavoritesOnly.addEventListener("change", onGeneratorSettingsChange);

    elements.generateButton.addEventListener("click", generateWorkout);
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    elements.tabs.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tabName);
    });
    elements.libraryTab.classList.toggle("active", tabName === "library");
    elements.generatorTab.classList.toggle("active", tabName === "generator");
  }

  function renderFilters() {
    renderChipGroup(
      elements.libraryEquipmentFilters,
      EQUIPMENT_OPTIONS,
      state.settings.library.equipment,
      (value) => {
        toggleSetValue(state.settings.library.equipment, value);
        persistSettings();
        renderFilters();
        renderExerciseList();
      }
    );

    renderChipGroup(
      elements.libraryBodyareaFilters,
      BODY_AREA_OPTIONS,
      state.settings.library.bodyAreas,
      (value) => {
        toggleSetValue(state.settings.library.bodyAreas, value);
        persistSettings();
        renderFilters();
        renderExerciseList();
      }
    );

    renderChipGroup(
      elements.generatorEquipmentFilters,
      EQUIPMENT_OPTIONS,
      state.settings.generator.equipment,
      (value) => {
        toggleSetValue(state.settings.generator.equipment, value);
        persistSettings();
        renderFilters();
      }
    );

    renderChipGroup(
      elements.generatorBodyareaFilters,
      BODY_AREA_OPTIONS,
      state.settings.generator.bodyAreas,
      (value) => {
        toggleSetValue(state.settings.generator.bodyAreas, value);
        persistSettings();
        renderFilters();
      }
    );
  }

  function renderChipGroup(container, values, selectedValues, onToggle) {
    container.innerHTML = "";
    values.forEach((value) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = value;
      if (selectedValues.has(value)) {
        chip.classList.add("active");
      }
      chip.addEventListener("click", () => onToggle(value));
      container.appendChild(chip);
    });
  }

  function renderExerciseList() {
    const filtered = exercises
      .filter((exercise) => matchesLibraryFilters(exercise))
      .sort((a, b) => a.name.localeCompare(b.name));

    elements.exerciseCount.textContent = String(filtered.length);
    elements.exerciseList.innerHTML = "";

    if (filtered.length === 0) {
      elements.exerciseList.innerHTML = `<p class="muted">Ingen ovelser matcher dine filtre.</p>`;
      return;
    }

    filtered.forEach((exercise) => {
      const card = document.createElement("article");
      card.className = "exercise-card";
      const imageUrl = getImageForExercise(exercise);
      card.innerHTML = `
        <img class="exercise-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(exercise.name)}" data-exercise-image="${exercise.id}" loading="lazy" width="120" height="76" />
        <div class="exercise-top">
          <h3 class="exercise-name">${escapeHtml(exercise.name)}</h3>
          <button class="favorite-btn ${state.favorites.has(exercise.id) ? "active" : ""}" data-id="${exercise.id}" aria-label="Toggle favorit">
            ${state.favorites.has(exercise.id) ? "★" : "☆"}
          </button>
        </div>
        <p class="meta">${escapeHtml(exercise.bodyAreas.join(", "))}</p>
        <p class="meta">${escapeHtml(exercise.equipment.join(", "))}</p>
      `;
      elements.exerciseList.appendChild(card);
      maybeLookupExerciseImage(exercise);
    });

    elements.exerciseList.querySelectorAll(".favorite-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const exerciseId = button.dataset.id;
        if (!exerciseId) return;
        toggleFavorite(exerciseId);
      });
    });
  }

  function matchesLibraryFilters(exercise) {
    const library = state.settings.library;
    const normalizedSearch = library.searchText.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 || exercise.name.toLowerCase().includes(normalizedSearch);

    const matchesFavorites = !library.favoritesOnly || state.favorites.has(exercise.id);

    const matchesEquipment =
      library.equipment.size === 0 || exercise.equipment.some((value) => library.equipment.has(value));

    const matchesBodyAreas =
      library.bodyAreas.size === 0 || exercise.bodyAreas.some((value) => library.bodyAreas.has(value));

    return matchesSearch && matchesFavorites && matchesEquipment && matchesBodyAreas;
  }

  function onGeneratorSettingsChange() {
    state.settings.generator.count = clampInt(elements.countInput.value, 1, 20, 6);
    state.settings.generator.minSets = clampInt(elements.minSetsInput.value, 1, 12, 3);
    state.settings.generator.maxSets = clampInt(elements.maxSetsInput.value, 1, 12, 4);
    state.settings.generator.minReps = clampInt(elements.minRepsInput.value, 1, 40, 8);
    state.settings.generator.maxReps = clampInt(elements.maxRepsInput.value, 1, 40, 12);
    state.settings.generator.favoritesOnly = elements.generatorFavoritesOnly.checked;

    if (state.settings.generator.maxSets < state.settings.generator.minSets) {
      state.settings.generator.maxSets = state.settings.generator.minSets;
    }
    if (state.settings.generator.maxReps < state.settings.generator.minReps) {
      state.settings.generator.maxReps = state.settings.generator.minReps;
    }

    hydrateInputsFromSettings();
    persistSettings();
  }

  function generateWorkout() {
    onGeneratorSettingsChange();
    const settings = state.settings.generator;

    const pool = exercises.filter((exercise) => {
      const matchesFavorites = !settings.favoritesOnly || state.favorites.has(exercise.id);
      const matchesEquipment =
        settings.equipment.size === 0 || exercise.equipment.some((value) => settings.equipment.has(value));
      const matchesBodyAreas =
        settings.bodyAreas.size === 0 || exercise.bodyAreas.some((value) => settings.bodyAreas.has(value));
      return matchesFavorites && matchesEquipment && matchesBodyAreas;
    });

    if (pool.length === 0) {
      state.generatedWorkout = [];
      renderGeneratedWorkout("Ingen ovelser matcher generator-filtrene.");
      return;
    }

    const selected = sampleUnique(pool, Math.min(settings.count, pool.length));
    state.generatedWorkout = selected.map((exercise) => ({
      exercise,
      sets: randomInt(settings.minSets, settings.maxSets),
      reps: randomInt(settings.minReps, settings.maxReps)
    }));

    renderGeneratedWorkout();
  }

  function renderGeneratedWorkout(message) {
    elements.generatedWorkout.innerHTML = "";

    if (message) {
      elements.generatedWorkout.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
      return;
    }

    if (state.generatedWorkout.length === 0) {
      elements.generatedWorkout.innerHTML = `<p class="muted">Generer en workout for at se resultater.</p>`;
      return;
    }

    state.generatedWorkout.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "workout-card";
      const imageUrl = getImageForExercise(item.exercise);
      card.innerHTML = `
        <img class="exercise-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.exercise.name)}" data-exercise-image="${item.exercise.id}" loading="lazy" width="120" height="76" />
        <h3 class="exercise-name">${index + 1}. ${escapeHtml(item.exercise.name)}</h3>
        <p class="workout-line">${item.sets} sets x ${item.reps} reps</p>
        <p class="meta">${escapeHtml(item.exercise.bodyAreas.join(", "))}</p>
      `;
      elements.generatedWorkout.appendChild(card);
      maybeLookupExerciseImage(item.exercise);
    });
  }

  function toggleFavorite(exerciseId) {
    toggleSetValue(state.favorites, exerciseId);
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(state.favorites)));
    renderExerciseList();
  }

  function hydrateInputsFromSettings() {
    const library = state.settings.library;
    const generator = state.settings.generator;

    elements.searchInput.value = library.searchText;
    elements.libraryFavoritesOnly.checked = library.favoritesOnly;
    elements.countInput.value = String(generator.count);
    elements.minSetsInput.value = String(generator.minSets);
    elements.maxSetsInput.value = String(generator.maxSets);
    elements.minRepsInput.value = String(generator.minReps);
    elements.maxRepsInput.value = String(generator.maxReps);
    elements.generatorFavoritesOnly.checked = generator.favoritesOnly;
  }

  function loadSettings() {
    const fallback = {
      library: {
        searchText: "",
        favoritesOnly: false,
        equipment: new Set(),
        bodyAreas: new Set()
      },
      generator: {
        count: 6,
        minSets: 3,
        maxSets: 4,
        minReps: 8,
        maxReps: 12,
        favoritesOnly: false,
        equipment: new Set(),
        bodyAreas: new Set()
      }
    };

    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw);
      return {
        library: {
          searchText: typeof parsed?.library?.searchText === "string" ? parsed.library.searchText : "",
          favoritesOnly: Boolean(parsed?.library?.favoritesOnly),
          equipment: new Set(Array.isArray(parsed?.library?.equipment) ? parsed.library.equipment : []),
          bodyAreas: new Set(Array.isArray(parsed?.library?.bodyAreas) ? parsed.library.bodyAreas : [])
        },
        generator: {
          count: clampInt(parsed?.generator?.count, 1, 20, 6),
          minSets: clampInt(parsed?.generator?.minSets, 1, 12, 3),
          maxSets: clampInt(parsed?.generator?.maxSets, 1, 12, 4),
          minReps: clampInt(parsed?.generator?.minReps, 1, 40, 8),
          maxReps: clampInt(parsed?.generator?.maxReps, 1, 40, 12),
          favoritesOnly: Boolean(parsed?.generator?.favoritesOnly),
          equipment: new Set(Array.isArray(parsed?.generator?.equipment) ? parsed.generator.equipment : []),
          bodyAreas: new Set(Array.isArray(parsed?.generator?.bodyAreas) ? parsed.generator.bodyAreas : [])
        }
      };
    } catch (_error) {
      return fallback;
    }
  }

  function persistSettings() {
    const serializable = {
      library: {
        searchText: state.settings.library.searchText,
        favoritesOnly: state.settings.library.favoritesOnly,
        equipment: Array.from(state.settings.library.equipment),
        bodyAreas: Array.from(state.settings.library.bodyAreas)
      },
      generator: {
        count: state.settings.generator.count,
        minSets: state.settings.generator.minSets,
        maxSets: state.settings.generator.maxSets,
        minReps: state.settings.generator.minReps,
        maxReps: state.settings.generator.maxReps,
        favoritesOnly: state.settings.generator.favoritesOnly,
        equipment: Array.from(state.settings.generator.equipment),
        bodyAreas: Array.from(state.settings.generator.bodyAreas)
      }
    };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(serializable));
  }

  function loadArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function loadObject(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  function getImageForExercise(exercise) {
    return state.imageCache[exercise.id] || placeholderImage(exercise.name);
  }

  function placeholderImage(name) {
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 3)
      .join("")
      .toUpperCase();
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
        <defs>
          <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#0b7285' />
            <stop offset='100%' stop-color='#5fa8d3' />
          </linearGradient>
        </defs>
        <rect width='640' height='360' fill='url(#bg)' />
        <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='96' fill='white' opacity='0.95'>${initials}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  function maybeLookupExerciseImage(exercise) {
    if (state.imageCache[exercise.id] || state.pendingImageLookups.has(exercise.id)) {
      return;
    }

    state.pendingImageLookups.add(exercise.id);
    lookupWikimediaExerciseImage(exercise)
      .then((url) => {
        if (!url) return;
        state.imageCache[exercise.id] = url;
        localStorage.setItem(STORAGE_KEYS.imageCache, JSON.stringify(state.imageCache));
        updateExerciseImages(exercise.id, url);
      })
      .catch(() => {})
      .finally(() => {
        state.pendingImageLookups.delete(exercise.id);
      });
  }

  async function lookupWikimediaExerciseImage(exercise) {
    const queries = buildSearchQueries(exercise);
    for (const query of queries) {
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;
      const response = await fetch(apiUrl);
      if (!response.ok) continue;
      const data = await response.json();
      const pages = data?.query?.pages;
      if (!pages) continue;

      const candidates = Object.values(pages)
        .map((page) => {
          const imageInfo = page?.imageinfo?.[0];
          if (!imageInfo) return null;
          return {
            title: String(page?.title || ""),
            url: imageInfo.thumburl || imageInfo.url || ""
          };
        })
        .filter(Boolean);

      const best = chooseBestCandidate(candidates, exercise);
      if (best) return best.url;
    }
    return null;
  }

  function buildSearchQueries(exercise) {
    const overrides = IMAGE_QUERY_OVERRIDES[exercise.name];
    if (overrides) return overrides;
    const primary = `${exercise.name} exercise`;
    const simpler = exercise.name
      .replaceAll("One-Arm", "")
      .replaceAll("Standing", "")
      .replaceAll("Conventional", "")
      .trim();
    const byBodyArea = `${simpler} ${exercise.bodyAreas[0] || "fitness"} training`;
    const fallback = `${simpler} gym form`;
    return [primary, byBodyArea, fallback];
  }

  function chooseBestCandidate(candidates, exercise) {
    const banned = [
      "logo",
      "icon",
      "diagram",
      "chart",
      "meme",
      "poster",
      "drawing",
      "cartoon",
      "anatomy",
      "skeleton"
    ];
    const tokens = exercise.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !["and", "with"].includes(token));

    let best = null;
    let bestScore = -999;

    candidates.forEach((candidate) => {
      const title = candidate.title.toLowerCase();
      const looksRaster = /\.(jpg|jpeg|png)\b/.test(title);
      if (!looksRaster) return;
      if (banned.some((word) => title.includes(word))) return;

      let score = 0;
      tokens.forEach((token) => {
        if (title.includes(token)) score += 3;
      });
      if (title.includes("exercise") || title.includes("workout") || title.includes("gym")) score += 1;
      if (title.includes("how to")) score += 1;

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    });

    return bestScore >= 3 ? best : null;
  }

  function updateExerciseImages(exerciseId, url) {
    const targets = document.querySelectorAll(`[data-exercise-image="${exerciseId}"]`);
    targets.forEach((img) => {
      img.setAttribute("src", url);
    });
  }

  function toggleSetValue(set, value) {
    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
  }

  function clampInt(value, min, max, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function sampleUnique(items, count) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
