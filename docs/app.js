(function () {
  const STORAGE_KEYS = {
    favorites: "fitness_randomizer_favorites_v1",
    settings: "fitness_randomizer_settings_v1",
    history: "fitness_randomizer_history_v1"
  };

  const exercises = EXERCISES.map((exercise, index) => ({
    id: `ex-${index + 1}`,
    ...exercise
  }));

  const state = {
    activeTab: "library",
    favorites: new Set(loadArray(STORAGE_KEYS.favorites)),
    settings: loadSettings(),
    history: loadArray(STORAGE_KEYS.history),
    generatedWorkout: []
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
    generatedWorkout: document.getElementById("generated-workout"),
    workoutHistory: document.getElementById("workout-history")
  };

  initialize();

  function initialize() {
    hydrateInputsFromSettings();
    wireEvents();
    renderFilters();
    renderExerciseList();
    renderGeneratedWorkout();
    renderHistory();
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
      card.innerHTML = `
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

    const entry = {
      createdAt: new Date().toISOString(),
      items: state.generatedWorkout.map((item) => ({
        name: item.exercise.name,
        sets: item.sets,
        reps: item.reps
      }))
    };
    state.history = [entry, ...state.history].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));

    renderGeneratedWorkout();
    renderHistory();
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
      card.innerHTML = `
        <h3 class="exercise-name">${index + 1}. ${escapeHtml(item.exercise.name)}</h3>
        <p class="workout-line">${item.sets} sets x ${item.reps} reps</p>
        <p class="meta">${escapeHtml(item.exercise.bodyAreas.join(", "))}</p>
      `;
      elements.generatedWorkout.appendChild(card);
    });
  }

  function renderHistory() {
    elements.workoutHistory.innerHTML = "";

    if (state.history.length === 0) {
      elements.workoutHistory.innerHTML = `<p class="muted">Ingen historik endnu.</p>`;
      return;
    }

    state.history.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "history-card";
      const timestamp = new Date(entry.createdAt).toLocaleString("da-DK");
      const lines = entry.items
        .map((item, index) => `${index + 1}. ${item.name} - ${item.sets} x ${item.reps}`)
        .join("<br>");
      card.innerHTML = `
        <p class="timestamp">${escapeHtml(timestamp)}</p>
        <p class="meta">${lines}</p>
      `;
      elements.workoutHistory.appendChild(card);
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
