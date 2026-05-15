(function () {
  const STORAGE_KEYS = {
    favorites: "fitness_randomizer_favorites_v1",
    settings: "fitness_randomizer_settings_v1",
    generatedWorkout: "fitness_randomizer_generated_workout_v1",
    workoutHistory: "fitness_randomizer_workout_history_v1",
    activeWorkout: "fitness_randomizer_active_workout_v1"
  };

  const state = {
    activeTab: "library",
    favorites: new Set(loadArray(STORAGE_KEYS.favorites)),
    settings: loadSettings(),
    generatedWorkout: loadGeneratedWorkout(),
    workoutHistory: loadWorkoutHistory(),
    activeWorkout: loadActiveWorkout(),
    exercises: EXERCISES.map((exercise, index) => ({
      id: `local-${index + 1}`,
      name: exercise.name,
      equipment: exercise.equipment || [],
      bodyAreas: exercise.bodyAreas || [],
      categories: Array.isArray(exercise.categories) && exercise.categories.length > 0
        ? exercise.categories
        : ["Main Workout"]
    }))
  };

  const elements = {
    tabs: document.querySelectorAll(".tab-button"),
    libraryTab: document.getElementById("library-tab"),
    generatorTab: document.getElementById("generator-tab"),
    historyTab: document.getElementById("history-tab"),
    startTab: document.getElementById("start-tab"),
    searchInput: document.getElementById("search-input"),
    libraryFavoritesOnly: document.getElementById("library-favorites-only"),
    libraryEquipmentFilters: document.getElementById("library-equipment-filters"),
    libraryBodyareaFilters: document.getElementById("library-bodyarea-filters"),
    libraryCategoryFilters: document.getElementById("library-category-filters"),
    exerciseCount: document.getElementById("exercise-count"),
    exerciseList: document.getElementById("exercise-list"),
    modeInput: document.getElementById("mode-input"),
    countInput: document.getElementById("count-input"),
    durationInput: document.getElementById("duration-input"),
    minSetsInput: document.getElementById("min-sets-input"),
    maxSetsInput: document.getElementById("max-sets-input"),
    minRepsInput: document.getElementById("min-reps-input"),
    maxRepsInput: document.getElementById("max-reps-input"),
    repSecondsInput: document.getElementById("rep-seconds-input"),
    restSecondsInput: document.getElementById("rest-seconds-input"),
    generatorFavoritesOnly: document.getElementById("generator-favorites-only"),
    includeWarmup: document.getElementById("include-warmup"),
    warmupCount: document.getElementById("warmup-count"),
    warmupDurationMinutes: document.getElementById("warmup-duration-minutes"),
    includeStretching: document.getElementById("include-stretching"),
    stretchCount: document.getElementById("stretch-count"),
    stretchDurationMinutes: document.getElementById("stretch-duration-minutes"),
    generatorEquipmentFilters: document.getElementById("generator-equipment-filters"),
    generatorBodyareaFilters: document.getElementById("generator-bodyarea-filters"),
    generatorCategoryFilters: document.getElementById("generator-category-filters"),
    generatorWarmupCategoryFilters: document.getElementById("generator-warmup-category-filters"),
    generatorStretchCategoryFilters: document.getElementById("generator-stretch-category-filters"),
    generateButton: document.getElementById("generate-button"),
    generatedWorkout: document.getElementById("generated-workout"),
    historyList: document.getElementById("history-list"),
    clearHistory: document.getElementById("clear-history"),
    startFromGenerated: document.getElementById("start-from-generated"),
    finishActiveWorkout: document.getElementById("finish-active-workout"),
    clearActiveWorkout: document.getElementById("clear-active-workout"),
    activeWorkoutSummary: document.getElementById("active-workout-summary"),
    activeWorkoutList: document.getElementById("active-workout-list"),
    currentExerciseFocus: document.getElementById("current-exercise-focus"),
    prevExercise: document.getElementById("prev-exercise"),
    nextExercise: document.getElementById("next-exercise"),
    markCurrentSet: document.getElementById("mark-current-set")
  };

  initialize();

  function initialize() {
    hydrateInputsFromSettings();
    updateGeneratorModeVisibility();
    wireEvents();
    renderFilters();
    renderExerciseList();
    renderGeneratedWorkout();
    renderHistory();
    renderActiveWorkout();
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

    elements.modeInput.addEventListener("change", onGeneratorSettingsChange);
    elements.countInput.addEventListener("change", onGeneratorSettingsChange);
    elements.durationInput.addEventListener("change", onGeneratorSettingsChange);
    elements.minSetsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.maxSetsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.minRepsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.maxRepsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.repSecondsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.restSecondsInput.addEventListener("change", onGeneratorSettingsChange);
    elements.generatorFavoritesOnly.addEventListener("change", onGeneratorSettingsChange);
    elements.includeWarmup.addEventListener("change", onGeneratorSettingsChange);
    elements.warmupCount.addEventListener("change", onGeneratorSettingsChange);
    elements.warmupDurationMinutes.addEventListener("change", onGeneratorSettingsChange);
    elements.includeStretching.addEventListener("change", onGeneratorSettingsChange);
    elements.stretchCount.addEventListener("change", onGeneratorSettingsChange);
    elements.stretchDurationMinutes.addEventListener("change", onGeneratorSettingsChange);
    elements.generateButton.addEventListener("click", generateWorkout);
    elements.clearHistory.addEventListener("click", clearAllHistory);
    elements.startFromGenerated.addEventListener("click", startFromGeneratedWorkout);
    elements.finishActiveWorkout.addEventListener("click", finishActiveWorkout);
    elements.clearActiveWorkout.addEventListener("click", clearActiveWorkout);
    elements.prevExercise.addEventListener("click", () => moveCurrentExercise(-1));
    elements.nextExercise.addEventListener("click", () => moveCurrentExercise(1));
    elements.markCurrentSet.addEventListener("click", markCurrentSetDone);
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    elements.tabs.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tabName);
    });
    elements.libraryTab.classList.toggle("active", tabName === "library");
    elements.generatorTab.classList.toggle("active", tabName === "generator");
    elements.historyTab.classList.toggle("active", tabName === "history");
    elements.startTab.classList.toggle("active", tabName === "start");
  }

  function renderFilters() {
    renderChipGroup(elements.libraryEquipmentFilters, EQUIPMENT_OPTIONS, state.settings.library.equipment, () => {
      persistSettings();
      renderFilters();
      renderExerciseList();
    });

    renderChipGroup(elements.libraryBodyareaFilters, BODY_AREA_OPTIONS, state.settings.library.bodyAreas, () => {
      persistSettings();
      renderFilters();
      renderExerciseList();
    });
    renderChipGroup(elements.libraryCategoryFilters, CATEGORY_OPTIONS, state.settings.library.categories, () => {
      persistSettings();
      renderFilters();
      renderExerciseList();
    });

    renderChipGroup(
      elements.generatorEquipmentFilters,
      EQUIPMENT_OPTIONS,
      state.settings.generator.equipment,
      () => {
        persistSettings();
        renderFilters();
      }
    );

    renderChipGroup(
      elements.generatorBodyareaFilters,
      BODY_AREA_OPTIONS,
      state.settings.generator.bodyAreas,
      () => {
        persistSettings();
        renderFilters();
      }
    );
    renderChipGroup(
      elements.generatorCategoryFilters,
      CATEGORY_OPTIONS,
      state.settings.generator.categories,
      () => {
        persistSettings();
        renderFilters();
      }
    );

    renderChipGroup(
      elements.generatorWarmupCategoryFilters,
      CATEGORY_OPTIONS,
      state.settings.generator.warmupCategories,
      () => {
        persistSettings();
        renderFilters();
      }
    );

    renderChipGroup(
      elements.generatorStretchCategoryFilters,
      CATEGORY_OPTIONS,
      state.settings.generator.stretchingCategories,
      () => {
        persistSettings();
        renderFilters();
      }
    );
  }

  function renderChipGroup(container, values, selectedValues, afterToggle) {
    container.innerHTML = "";
    values.forEach((value) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = value;
      if (selectedValues.has(value)) chip.classList.add("active");
      chip.addEventListener("click", () => {
        toggleSetValue(selectedValues, value);
        afterToggle();
      });
      container.appendChild(chip);
    });
  }

  function renderExerciseList() {
    const filtered = state.exercises
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
        <a class="demo-link" href="${escapeHtml(getDemoSearchUrl(exercise.name))}" target="_blank" rel="noopener noreferrer">Demo</a>
        <p class="meta">${escapeHtml(exercise.bodyAreas.join(", "))}</p>
        <p class="meta">${escapeHtml(exercise.categories.join(", "))}</p>
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
    const matchesCategories =
      library.categories.size === 0 || exercise.categories.some((value) => library.categories.has(value));

    return matchesSearch && matchesFavorites && matchesEquipment && matchesBodyAreas && matchesCategories;
  }

  function onGeneratorSettingsChange() {
    state.settings.generator.mode = elements.modeInput.value === "time" ? "time" : "count";
    state.settings.generator.count = clampInt(elements.countInput.value, 1, 20, 6);
    state.settings.generator.durationMinutes = clampInt(elements.durationInput.value, 5, 180, 45);
    state.settings.generator.minSets = clampInt(elements.minSetsInput.value, 1, 12, 3);
    state.settings.generator.maxSets = clampInt(elements.maxSetsInput.value, 1, 12, 4);
    state.settings.generator.minReps = clampInt(elements.minRepsInput.value, 1, 40, 8);
    state.settings.generator.maxReps = clampInt(elements.maxRepsInput.value, 1, 40, 12);
    state.settings.generator.repSeconds = clampInt(elements.repSecondsInput.value, 1, 10, 3);
    state.settings.generator.restSeconds = clampInt(elements.restSecondsInput.value, 0, 300, 75);
    state.settings.generator.favoritesOnly = elements.generatorFavoritesOnly.checked;
    state.settings.generator.warmup.enabled = elements.includeWarmup.checked;
    state.settings.generator.warmup.count = clampInt(elements.warmupCount.value, 0, 10, 3);
    state.settings.generator.warmup.durationMinutes = clampInt(elements.warmupDurationMinutes.value, 1, 60, 8);
    state.settings.generator.stretching.enabled = elements.includeStretching.checked;
    state.settings.generator.stretching.count = clampInt(elements.stretchCount.value, 0, 10, 3);
    state.settings.generator.stretching.durationMinutes = clampInt(elements.stretchDurationMinutes.value, 1, 60, 6);

    if (state.settings.generator.maxSets < state.settings.generator.minSets) {
      state.settings.generator.maxSets = state.settings.generator.minSets;
    }
    if (state.settings.generator.maxReps < state.settings.generator.minReps) {
      state.settings.generator.maxReps = state.settings.generator.minReps;
    }
    updateGeneratorModeVisibility();
    hydrateInputsFromSettings();
    persistSettings();
  }

  function generateWorkout() {
    onGeneratorSettingsChange();
    const settings = state.settings.generator;
    const lockedItems = state.generatedWorkout.filter((item) => item.locked && item.block === "Main");
    const lockedIds = new Set(lockedItems.map((item) => item.exercise.id));

    const matchesCommonGeneratorFilters = (exercise) => {
      if (lockedIds.has(exercise.id)) return false;
      const matchesFavorites = !settings.favoritesOnly || state.favorites.has(exercise.id);
      const matchesEquipment =
        settings.equipment.size === 0 || exercise.equipment.some((value) => settings.equipment.has(value));
      const matchesBodyAreas =
        settings.bodyAreas.size === 0 || exercise.bodyAreas.some((value) => settings.bodyAreas.has(value));
      return matchesFavorites && matchesEquipment && matchesBodyAreas;
    };

    const matchesMainCategories = (exercise) =>
      settings.categories.size === 0 || exercise.categories.some((value) => settings.categories.has(value));
    const matchesWarmupCategories = (exercise) =>
      settings.warmupCategories.size === 0 ||
      exercise.categories.some((value) => settings.warmupCategories.has(value));
    const matchesStretchCategories = (exercise) =>
      settings.stretchingCategories.size === 0 ||
      exercise.categories.some((value) => settings.stretchingCategories.has(value));

    const mainPool = state.exercises.filter((exercise) => {
      if (!matchesCommonGeneratorFilters(exercise)) return false;
      const isMain = exercise.categories.includes("Main Workout") || exercise.categories.includes("Cardio");
      const isWarmOrStretch = exercise.categories.includes("Warm-Up") || exercise.categories.includes("Stretching");
      return matchesMainCategories(exercise) && isMain && !isWarmOrStretch;
    });

    const warmupPool = state.exercises.filter(
      (exercise) =>
        matchesCommonGeneratorFilters(exercise) &&
        exercise.categories.includes("Warm-Up") &&
        matchesWarmupCategories(exercise)
    );
    const stretchPool = state.exercises.filter(
      (exercise) =>
        matchesCommonGeneratorFilters(exercise) &&
        exercise.categories.includes("Stretching") &&
        matchesStretchCategories(exercise)
    );

    const hasAnyCandidate =
      mainPool.length > 0 ||
      lockedItems.length > 0 ||
      (settings.warmup.enabled && warmupPool.length > 0) ||
      (settings.stretching.enabled && stretchPool.length > 0);
    if (!hasAnyCandidate) {
      state.generatedWorkout = [];
      localStorage.setItem(STORAGE_KEYS.generatedWorkout, JSON.stringify([]));
      renderGeneratedWorkout("Ingen ovelser matcher generator-filtrene.");
      return;
    }

    if (settings.mode === "time") {
      const totalSeconds = settings.durationMinutes * 60;
      const lockedSeconds = totalWorkoutSeconds(lockedItems, settings);
      const warmupBudget = settings.warmup.enabled ? settings.warmup.durationMinutes * 60 : 0;
      const stretchBudget = settings.stretching.enabled ? settings.stretching.durationMinutes * 60 : 0;
      const mainBudget = Math.max(0, totalSeconds - warmupBudget - stretchBudget - lockedSeconds);

      const warmupItems = settings.warmup.enabled
        ? generateTimedSectionItems(
            warmupPool,
            settings.warmup.count,
            warmupBudget,
            "Warm-Up"
          )
        : [];
      const stretchItems = settings.stretching.enabled
        ? generateTimedSectionItems(
            stretchPool,
            settings.stretching.count,
            stretchBudget,
            "Stretching"
          )
        : [];
      const freshItems = generateWorkoutByTime(mainPool, settings, mainBudget);

      state.generatedWorkout = [...warmupItems, ...lockedItems, ...freshItems, ...stretchItems];
    } else {
      const warmupItems = settings.warmup.enabled
        ? generateTimedSectionItems(
            warmupPool,
            settings.warmup.count,
            settings.warmup.durationMinutes * 60,
            "Warm-Up"
          )
        : [];
      const stretchItems = settings.stretching.enabled
        ? generateTimedSectionItems(
            stretchPool,
            settings.stretching.count,
            settings.stretching.durationMinutes * 60,
            "Stretching"
          )
        : [];

      let freshItems = [];
      const remainingCount = Math.max(0, settings.count - lockedItems.length);
      const selected = sampleUnique(mainPool, Math.min(remainingCount, mainPool.length));
      freshItems = selected.map((exercise) => ({
        exercise,
        sets: randomInt(settings.minSets, settings.maxSets),
        reps: randomInt(settings.minReps, settings.maxReps),
        locked: false,
        block: "Main"
      }));

      state.generatedWorkout = [...warmupItems, ...lockedItems, ...freshItems, ...stretchItems];
    }
    persistGeneratedWorkout();
    pushWorkoutHistoryEntry(state.generatedWorkout);

    renderGeneratedWorkout();
    renderHistory();
  }

  function regenerateGeneratedWorkoutItem(index) {
    const item = state.generatedWorkout[index];
    if (!item) return;

    onGeneratorSettingsChange();
    const settings = state.settings.generator;
    const excludedIds = new Set(
      state.generatedWorkout
        .filter((_entry, itemIndex) => itemIndex !== index)
        .map((entry) => entry.exercise.id)
    );
    const pool = getReplacementPoolForItem(item, settings, excludedIds)
      .filter((exercise) => exercise.id !== item.exercise.id);

    if (pool.length === 0) return;
    item.exercise = pool[randomInt(0, pool.length - 1)];
    persistGeneratedWorkout();
    renderGeneratedWorkout();
  }

  function getReplacementPoolForItem(item, settings, excludedIds) {
    return state.exercises.filter((exercise) => {
      if (excludedIds.has(exercise.id)) return false;

      const matchesFavorites = !settings.favoritesOnly || state.favorites.has(exercise.id);
      const matchesEquipment =
        settings.equipment.size === 0 || exercise.equipment.some((value) => settings.equipment.has(value));
      const matchesBodyAreas =
        settings.bodyAreas.size === 0 || exercise.bodyAreas.some((value) => settings.bodyAreas.has(value));
      if (!matchesFavorites || !matchesEquipment || !matchesBodyAreas) return false;

      const isWarmup = exercise.categories.includes("Warm-Up");
      const isStretching = exercise.categories.includes("Stretching");
      if (item.block === "Warm-Up") {
        const matchesWarmupCategories =
          settings.warmupCategories.size === 0 ||
          exercise.categories.some((value) => settings.warmupCategories.has(value));
        return isWarmup && matchesWarmupCategories;
      }
      if (item.block === "Stretching") {
        const matchesStretchCategories =
          settings.stretchingCategories.size === 0 ||
          exercise.categories.some((value) => settings.stretchingCategories.has(value));
        return isStretching && matchesStretchCategories;
      }

      const matchesCategories =
        settings.categories.size === 0 || exercise.categories.some((value) => settings.categories.has(value));
      const isMain = exercise.categories.includes("Main Workout") || exercise.categories.includes("Cardio");
      return matchesCategories && isMain && !isWarmup && !isStretching;
    });
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

    const totalSeconds = totalWorkoutSeconds(state.generatedWorkout, state.settings.generator);
    const estimate = document.createElement("p");
    estimate.className = "meta";
    estimate.textContent = `Estimeret varighed: ca. ${Math.max(1, Math.round(totalSeconds / 60))} min`;
    elements.generatedWorkout.appendChild(estimate);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "secondary";
    addButton.textContent = "Tilfoej ovelse";
    addButton.addEventListener("click", () => {
      addExerciseToGeneratedWorkout();
    });
    elements.generatedWorkout.appendChild(addButton);

    const datalistId = "exercise-options-datalist";
    const datalistOptions = state.exercises
      .map((exercise) => `<option value="${escapeHtml(exercise.name)}"></option>`)
      .join("");
    const datalist = document.createElement("datalist");
    datalist.id = datalistId;
    datalist.innerHTML = datalistOptions;
    elements.generatedWorkout.appendChild(datalist);

    let lastBlock = "";
    state.generatedWorkout.forEach((item, index) => {
      if (item.block && item.block !== lastBlock) {
        const sectionTitle = document.createElement("h3");
        sectionTitle.className = "exercise-name";
        sectionTitle.textContent = item.block;
        elements.generatedWorkout.appendChild(sectionTitle);
        lastBlock = item.block;
      }
      const card = document.createElement("article");
      card.className = "workout-card";
      const isTimedSection = item.block === "Warm-Up" || item.block === "Stretching";
      const repsMax = isTimedSection ? 3600 : 40;
      const repsLabel = isTimedSection ? "Sekunder" : "Reps";

      card.innerHTML = `
        <h3 class="exercise-name">${index + 1}. ${escapeHtml(item.exercise.name)}</h3>
        <label class="checkbox-row compact-row">
          <input data-edit-type="lock" data-index="${index}" type="checkbox" ${item.locked ? "checked" : ""} />
          <span>Laas ovelse</span>
        </label>
        <a class="demo-link" href="${escapeHtml(getDemoSearchUrl(item.exercise.name))}" target="_blank" rel="noopener noreferrer">Demo</a>
        <label class="field">
          <span>Ovelse (sogbar)</span>
          <input data-edit-type="exercise-search" data-index="${index}" type="search" list="${datalistId}" value="${escapeHtml(item.exercise.name)}" placeholder="Sog efter ovelse..." />
        </label>
        <div class="inline-edit">
          <label class="field">
            <span>Sets</span>
            <input data-edit-type="sets" data-index="${index}" type="number" min="1" max="12" value="${item.sets}" />
          </label>
          <label class="field">
            <span>${repsLabel}</span>
            <input data-edit-type="reps" data-index="${index}" type="number" min="1" max="${repsMax}" value="${item.reps}" />
          </label>
        </div>
        <p class="workout-line">${
          isTimedSection
            ? `${item.sets} set x ${item.reps} sek hold`
            : `${item.sets} sets x ${item.reps} reps`
        }</p>
        <p class="meta">${escapeHtml(item.exercise.bodyAreas.join(", "))} • ${escapeHtml(item.exercise.categories.join(", "))}</p>
        <div class="workout-actions">
          <button type="button" class="secondary small" data-edit-type="regenerate" data-index="${index}">Regenerer</button>
          <button type="button" class="secondary small" data-edit-type="duplicate" data-index="${index}">Dupliker</button>
          <button type="button" class="secondary small" data-edit-type="up" data-index="${index}">Op</button>
          <button type="button" class="secondary small" data-edit-type="down" data-index="${index}">Ned</button>
          <button type="button" class="danger small" data-edit-type="remove" data-index="${index}">Fjern</button>
        </div>
      `;
      card.setAttribute("draggable", "true");
      card.setAttribute("data-drag-index", String(index));
      elements.generatedWorkout.appendChild(card);
    });

    wireDragAndDrop();
    elements.generatedWorkout.querySelectorAll("[data-edit-type]").forEach((control) => {
      const action = control.getAttribute("data-edit-type");
      const index = Number.parseInt(control.getAttribute("data-index") || "", 10);
      if (Number.isNaN(index)) return;

      if (action === "remove") {
        control.addEventListener("click", () => {
          removeGeneratedWorkoutItem(index);
        });
      } else if (action === "regenerate") {
        control.addEventListener("click", () => {
          regenerateGeneratedWorkoutItem(index);
        });
      } else if (action === "duplicate") {
        control.addEventListener("click", () => {
          duplicateGeneratedWorkoutItem(index);
        });
      } else if (action === "up") {
        control.addEventListener("click", () => {
          moveGeneratedWorkoutItem(index, index - 1);
        });
      } else if (action === "down") {
        control.addEventListener("click", () => {
          moveGeneratedWorkoutItem(index, index + 1);
        });
      } else {
        control.addEventListener("change", (event) => {
          onGeneratedWorkoutEdit(action, index, event.target);
        });
      }
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
    elements.modeInput.value = generator.mode || "count";
    elements.countInput.value = String(generator.count);
    elements.durationInput.value = String(generator.durationMinutes || 45);
    elements.minSetsInput.value = String(generator.minSets);
    elements.maxSetsInput.value = String(generator.maxSets);
    elements.minRepsInput.value = String(generator.minReps);
    elements.maxRepsInput.value = String(generator.maxReps);
    elements.repSecondsInput.value = String(generator.repSeconds || 3);
    elements.restSecondsInput.value = String(generator.restSeconds || 75);
    elements.generatorFavoritesOnly.checked = generator.favoritesOnly;
    elements.includeWarmup.checked = generator.warmup?.enabled ?? true;
    elements.warmupCount.value = String(generator.warmup?.count ?? 3);
    elements.warmupDurationMinutes.value = String(generator.warmup?.durationMinutes ?? 8);
    elements.includeStretching.checked = generator.stretching?.enabled ?? true;
    elements.stretchCount.value = String(generator.stretching?.count ?? 3);
    elements.stretchDurationMinutes.value = String(generator.stretching?.durationMinutes ?? 6);
  }

  function updateGeneratorModeVisibility() {
    const mode = elements.modeInput.value === "time" ? "time" : "count";
    document.querySelectorAll(".mode-count").forEach((node) => {
      node.classList.toggle("hidden-field", mode !== "count");
    });
    document.querySelectorAll(".mode-time").forEach((node) => {
      node.classList.toggle("hidden-field", mode !== "time");
    });
  }

  function loadSettings() {
    const fallback = {
      library: {
        searchText: "",
        favoritesOnly: false,
        equipment: new Set(),
        bodyAreas: new Set(),
        categories: new Set()
      },
      generator: {
        mode: "count",
        count: 6,
        durationMinutes: 45,
        minSets: 3,
        maxSets: 4,
        minReps: 8,
        maxReps: 12,
        repSeconds: 3,
        restSeconds: 75,
        favoritesOnly: false,
        equipment: new Set(),
        bodyAreas: new Set(),
        categories: new Set(),
        warmupCategories: new Set(),
        stretchingCategories: new Set(),
        warmup: {
          enabled: true,
          count: 3,
          durationMinutes: 8
        },
        stretching: {
          enabled: true,
          count: 3,
          durationMinutes: 6
        }
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
          bodyAreas: new Set(Array.isArray(parsed?.library?.bodyAreas) ? parsed.library.bodyAreas : []),
          categories: new Set(Array.isArray(parsed?.library?.categories) ? parsed.library.categories : [])
        },
        generator: {
          mode: parsed?.generator?.mode === "time" ? "time" : "count",
          count: clampInt(parsed?.generator?.count, 1, 20, 6),
          durationMinutes: clampInt(parsed?.generator?.durationMinutes, 5, 180, 45),
          minSets: clampInt(parsed?.generator?.minSets, 1, 12, 3),
          maxSets: clampInt(parsed?.generator?.maxSets, 1, 12, 4),
          minReps: clampInt(parsed?.generator?.minReps, 1, 40, 8),
          maxReps: clampInt(parsed?.generator?.maxReps, 1, 40, 12),
          repSeconds: clampInt(parsed?.generator?.repSeconds, 1, 10, 3),
          restSeconds: clampInt(parsed?.generator?.restSeconds, 0, 300, 75),
          favoritesOnly: Boolean(parsed?.generator?.favoritesOnly),
          equipment: new Set(Array.isArray(parsed?.generator?.equipment) ? parsed.generator.equipment : []),
          bodyAreas: new Set(Array.isArray(parsed?.generator?.bodyAreas) ? parsed.generator.bodyAreas : []),
          categories: new Set(Array.isArray(parsed?.generator?.categories) ? parsed.generator.categories : []),
          warmupCategories: new Set(Array.isArray(parsed?.generator?.warmupCategories) ? parsed.generator.warmupCategories : []),
          stretchingCategories: new Set(Array.isArray(parsed?.generator?.stretchingCategories) ? parsed.generator.stretchingCategories : []),
          warmup: {
            enabled: parsed?.generator?.warmup?.enabled !== false,
            count: clampInt(parsed?.generator?.warmup?.count, 0, 10, 3),
            durationMinutes: clampInt(parsed?.generator?.warmup?.durationMinutes, 1, 60, 8)
          },
          stretching: {
            enabled: parsed?.generator?.stretching?.enabled !== false,
            count: clampInt(parsed?.generator?.stretching?.count, 0, 10, 3),
            durationMinutes: clampInt(parsed?.generator?.stretching?.durationMinutes, 1, 60, 6)
          }
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
        bodyAreas: Array.from(state.settings.library.bodyAreas),
        categories: Array.from(state.settings.library.categories)
      },
      generator: {
        mode: state.settings.generator.mode,
        count: state.settings.generator.count,
        durationMinutes: state.settings.generator.durationMinutes,
        minSets: state.settings.generator.minSets,
        maxSets: state.settings.generator.maxSets,
        minReps: state.settings.generator.minReps,
        maxReps: state.settings.generator.maxReps,
        repSeconds: state.settings.generator.repSeconds,
        restSeconds: state.settings.generator.restSeconds,
        favoritesOnly: state.settings.generator.favoritesOnly,
        equipment: Array.from(state.settings.generator.equipment),
        bodyAreas: Array.from(state.settings.generator.bodyAreas),
        categories: Array.from(state.settings.generator.categories),
        warmupCategories: Array.from(state.settings.generator.warmupCategories),
        stretchingCategories: Array.from(state.settings.generator.stretchingCategories),
        warmup: {
          enabled: state.settings.generator.warmup.enabled,
          count: state.settings.generator.warmup.count,
          durationMinutes: state.settings.generator.warmup.durationMinutes
        },
        stretching: {
          enabled: state.settings.generator.stretching.enabled,
          count: state.settings.generator.stretching.count,
          durationMinutes: state.settings.generator.stretching.durationMinutes
        }
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

  function loadGeneratedWorkout() {
    const raw = loadArray(STORAGE_KEYS.generatedWorkout);
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const exercise = item.exercise;
        const sets = Number.parseInt(String(item.sets), 10);
        const reps = Number.parseInt(String(item.reps), 10);
        if (!exercise || typeof exercise !== "object") return null;
        if (!exercise.id || !exercise.name) return null;
        if (Number.isNaN(sets) || Number.isNaN(reps)) return null;
        return {
          exercise: {
            id: String(exercise.id),
            name: String(exercise.name),
            equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [],
            bodyAreas: Array.isArray(exercise.bodyAreas) ? exercise.bodyAreas : [],
            categories: Array.isArray(exercise.categories) && exercise.categories.length > 0
              ? exercise.categories
              : ["Main Workout"]
          },
          sets,
          reps,
          locked: Boolean(item.locked),
          block: typeof item.block === "string" ? item.block : "Main"
        };
      })
      .filter(Boolean);
  }

  function persistGeneratedWorkout() {
    localStorage.setItem(STORAGE_KEYS.generatedWorkout, JSON.stringify(state.generatedWorkout));
  }

  function toggleSetValue(set, value) {
    if (set.has(value)) set.delete(value);
    else set.add(value);
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

  function generateTimedSectionItems(pool, count, totalSeconds, block) {
    if (!Array.isArray(pool) || pool.length === 0 || count <= 0) return [];
    const selected = sampleUnique(pool, Math.min(count, pool.length));
    const exerciseSeconds = Math.max(1, Math.round(Math.max(1, totalSeconds) / selected.length));
    return selected.map((exercise) => ({
      exercise,
      sets: 1,
      reps: exerciseSeconds,
      locked: false,
      block
    }));
  }

  function estimateExerciseSeconds(sets, reps, settings) {
    const workSeconds = sets * reps * settings.repSeconds;
    const restSeconds = Math.max(0, sets - 1) * settings.restSeconds;
    return workSeconds + restSeconds;
  }

  function totalWorkoutSeconds(workoutItems, settings) {
    return workoutItems.reduce((sum, item) => {
      const isTimedSection = item.block === "Warm-Up" || item.block === "Stretching";
      if (isTimedSection) {
        return sum + Math.max(1, item.sets) * Math.max(1, item.reps);
      }
      return sum + estimateExerciseSeconds(item.sets, item.reps, settings);
    }, 0);
  }

  function generateWorkoutByTime(pool, settings, targetSecondsOverride) {
    const targetSeconds = targetSecondsOverride || settings.durationMinutes * 60;
    if (targetSeconds <= 0) return [];
    const shuffled = sampleUnique(pool, pool.length);
    const result = [];
    let accumulated = 0;

    for (const exercise of shuffled) {
      const sets = randomInt(settings.minSets, settings.maxSets);
      const reps = randomInt(settings.minReps, settings.maxReps);
      const seconds = estimateExerciseSeconds(sets, reps, settings);

      if (accumulated + seconds <= targetSeconds || result.length === 0) {
        result.push({ exercise, sets, reps, locked: false, block: "Main" });
        accumulated += seconds;
      }
      if (accumulated >= targetSeconds) break;
    }

    return result;
  }

  function onGeneratedWorkoutEdit(action, index, target) {
    const item = state.generatedWorkout[index];
    if (!item) return;

    if (action === "sets") {
      item.sets = clampInt(target.value, 1, 12, item.sets);
    } else if (action === "reps") {
      const maxReps = item.block === "Warm-Up" || item.block === "Stretching" ? 3600 : 40;
      item.reps = clampInt(target.value, 1, maxReps, item.reps);
    } else if (action === "exercise-search") {
      const nextExercise = findExerciseByName(target.value);
      if (nextExercise) {
        item.exercise = nextExercise;
        target.value = nextExercise.name;
      } else {
        target.value = item.exercise.name;
      }
    } else if (action === "lock") {
      item.locked = Boolean(target.checked);
    }

    persistGeneratedWorkout();
    renderGeneratedWorkout();
  }

  function removeGeneratedWorkoutItem(index) {
    if (index < 0 || index >= state.generatedWorkout.length) return;
    const item = state.generatedWorkout[index];
    const exerciseName = item?.exercise?.name || "denne ovelse";
    const confirmed = window.confirm(`Er du sikker pa, at du vil fjerne ${exerciseName}?`);
    if (!confirmed) return;
    state.generatedWorkout.splice(index, 1);
    persistGeneratedWorkout();
    renderGeneratedWorkout();
  }

  function addExerciseToGeneratedWorkout() {
    const usedIds = new Set(state.generatedWorkout.map((item) => item.exercise.id));
    const candidate =
      state.exercises.find((exercise) => !usedIds.has(exercise.id)) ||
      state.exercises[0];
    if (!candidate) return;

    state.generatedWorkout.push({
      exercise: candidate,
      sets: clampInt(state.settings.generator.minSets, 1, 12, 3),
      reps: clampInt(state.settings.generator.minReps, 1, 40, 8),
      locked: false,
      block: "Main"
    });
    persistGeneratedWorkout();
    renderGeneratedWorkout();
  }

  function pushWorkoutHistoryEntry(workoutItems) {
    if (!Array.isArray(workoutItems) || workoutItems.length === 0) return;
    const entry = {
      id: `h-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: workoutItems.map((item) => ({
        exercise: item.exercise,
        sets: item.sets,
        reps: item.reps,
        locked: Boolean(item.locked),
        block: typeof item.block === "string" ? item.block : "Main"
      }))
    };
    state.workoutHistory.unshift(entry);
    state.workoutHistory = state.workoutHistory.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.workoutHistory, JSON.stringify(state.workoutHistory));
  }

  function startFromGeneratedWorkout() {
    if (!Array.isArray(state.generatedWorkout) || state.generatedWorkout.length === 0) return;
    state.activeWorkout = {
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      items: state.generatedWorkout.map((item) => ({
        exercise: item.exercise,
        sets: item.sets,
        reps: item.reps,
        completedSets: 0
      }))
    };
    persistActiveWorkout();
    switchTab("start");
    renderActiveWorkout();
  }

  function finishActiveWorkout() {
    if (!state.activeWorkout || !Array.isArray(state.activeWorkout.items) || state.activeWorkout.items.length === 0) return;
    const completedPlan = state.activeWorkout.items.map((item) => ({
      exercise: item.exercise,
      sets: item.sets,
      reps: item.reps,
      locked: false,
      block: "Main"
    }));
    pushWorkoutHistoryEntry(completedPlan);
    state.activeWorkout = null;
    localStorage.removeItem(STORAGE_KEYS.activeWorkout);
    renderHistory();
    renderActiveWorkout();
  }

  function clearActiveWorkout() {
    state.activeWorkout = null;
    localStorage.removeItem(STORAGE_KEYS.activeWorkout);
    renderActiveWorkout();
  }

  function renderActiveWorkout() {
    elements.activeWorkoutList.innerHTML = "";
    if (!state.activeWorkout || !Array.isArray(state.activeWorkout.items) || state.activeWorkout.items.length === 0) {
      elements.activeWorkoutSummary.textContent = "";
      elements.currentExerciseFocus.textContent = "Ingen aktiv workout.";
      elements.prevExercise.disabled = true;
      elements.nextExercise.disabled = true;
      elements.markCurrentSet.disabled = true;
      elements.activeWorkoutList.innerHTML =
        `<p class="muted">Start en workout fra din seneste genererede plan.</p>`;
      return;
    }

    const currentIndex = clampInt(
      state.activeWorkout.currentExerciseIndex ?? 0,
      0,
      Math.max(0, state.activeWorkout.items.length - 1),
      0
    );
    state.activeWorkout.currentExerciseIndex = currentIndex;

    const totalSets = state.activeWorkout.items.reduce((sum, item) => sum + item.sets, 0);
    const doneSets = state.activeWorkout.items.reduce((sum, item) => sum + item.completedSets, 0);
    const elapsedMin = Math.max(
      0,
      Math.round((Date.now() - new Date(state.activeWorkout.startedAt).getTime()) / 60000)
    );
    elements.activeWorkoutSummary.textContent = `Progress: ${doneSets}/${totalSets} sets (${Math.round(
      (doneSets / Math.max(1, totalSets)) * 100
    )}%) • Tid: ${elapsedMin} min`;
    const current = state.activeWorkout.items[currentIndex];
    elements.currentExerciseFocus.textContent = current
      ? `${currentIndex + 1}/${state.activeWorkout.items.length}: ${current.exercise.name} (${current.completedSets}/${current.sets} sets færdig)`
      : "Ingen nuværende øvelse.";
    elements.prevExercise.disabled = false;
    elements.nextExercise.disabled = false;
    elements.markCurrentSet.disabled = false;

    state.activeWorkout.items.forEach((item, exerciseIndex) => {
      const card = document.createElement("article");
      const isExerciseDone = item.completedSets >= item.sets;
      card.className = `workout-card${exerciseIndex === currentIndex ? " active-workout-card" : ""}${
        isExerciseDone ? " completed-workout-card" : ""
      }`;
      const pills = Array.from({ length: item.sets }, (_, setIndex) => {
        const done = setIndex < item.completedSets;
        return `<button type="button" class="set-pill ${done ? "done" : ""}" data-active-action="set" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}">Set ${setIndex + 1}</button>`;
      }).join("");

      card.innerHTML = `
        <h3 class="exercise-name">${exerciseIndex + 1}. ${escapeHtml(item.exercise.name)}</h3>
        <a class="demo-link" href="${escapeHtml(getDemoSearchUrl(item.exercise.name))}" target="_blank" rel="noopener noreferrer">Demo</a>
        <p class="workout-line">${
          item.exercise.categories.includes("Warm-Up") || item.exercise.categories.includes("Stretching")
            ? `${item.sets} set x ${item.reps} sek hold`
            : `${item.sets} sets x ${item.reps} reps`
        }</p>
        <div class="set-track">${pills}</div>
        <p class="set-help">Swipe pa et set (eller tryk) for at markere/afmarkere.</p>
      `;
      elements.activeWorkoutList.appendChild(card);
    });

    wireActiveWorkoutSetControls();
  }

  function wireActiveWorkoutSetControls() {
    elements.activeWorkoutList.querySelectorAll('[data-active-action="set"]').forEach((button) => {
      button.addEventListener("click", () => {
        toggleSetFromControl(button);
      });

      let touchStartX = null;
      button.addEventListener(
        "touchstart",
        (event) => {
          touchStartX = event.changedTouches[0]?.clientX ?? null;
        },
        { passive: true }
      );
      button.addEventListener(
        "touchend",
        (event) => {
          const touchEndX = event.changedTouches[0]?.clientX ?? null;
          if (touchStartX === null || touchEndX === null) return;
          if (Math.abs(touchEndX - touchStartX) >= 24) {
            toggleSetFromControl(button);
          }
        },
        { passive: true }
      );
    });
  }

  function toggleSetFromControl(control) {
    const exerciseIndex = Number.parseInt(control.getAttribute("data-exercise-index") || "", 10);
    const setIndex = Number.parseInt(control.getAttribute("data-set-index") || "", 10);
    if (Number.isNaN(exerciseIndex) || Number.isNaN(setIndex)) return;
    const item = state.activeWorkout?.items?.[exerciseIndex];
    if (!item) return;

    const targetCompleted = setIndex + 1;
    item.completedSets = item.completedSets === targetCompleted ? targetCompleted - 1 : targetCompleted;
    item.completedSets = Math.max(0, Math.min(item.sets, item.completedSets));
    persistActiveWorkout();
    renderActiveWorkout();
  }

  function moveCurrentExercise(delta) {
    if (!state.activeWorkout || !Array.isArray(state.activeWorkout.items) || state.activeWorkout.items.length === 0) return;
    const maxIndex = state.activeWorkout.items.length - 1;
    const nextIndex = Math.max(0, Math.min(maxIndex, (state.activeWorkout.currentExerciseIndex || 0) + delta));
    state.activeWorkout.currentExerciseIndex = nextIndex;
    persistActiveWorkout();
    renderActiveWorkout();
  }

  function markCurrentSetDone() {
    if (!state.activeWorkout || !Array.isArray(state.activeWorkout.items) || state.activeWorkout.items.length === 0) return;
    const index = clampInt(
      state.activeWorkout.currentExerciseIndex ?? 0,
      0,
      Math.max(0, state.activeWorkout.items.length - 1),
      0
    );
    const item = state.activeWorkout.items[index];
    if (!item) return;
    item.completedSets = Math.max(0, Math.min(item.sets, (item.completedSets || 0) + 1));
    persistActiveWorkout();
    renderActiveWorkout();
  }

  function loadWorkoutHistory() {
    const raw = loadArray(STORAGE_KEYS.workoutHistory);
    return raw
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        if (!Array.isArray(entry.items) || entry.items.length === 0) return null;
        return {
          id: String(entry.id || `h-${Math.random().toString(36).slice(2)}`),
          createdAt: String(entry.createdAt || new Date().toISOString()),
          items: entry.items
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const exercise = item.exercise;
              const sets = Number.parseInt(String(item.sets), 10);
              const reps = Number.parseInt(String(item.reps), 10);
              if (!exercise || !exercise.id || !exercise.name) return null;
              if (Number.isNaN(sets) || Number.isNaN(reps)) return null;
              return {
                exercise: {
                  id: String(exercise.id),
                  name: String(exercise.name),
                  equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [],
                  bodyAreas: Array.isArray(exercise.bodyAreas) ? exercise.bodyAreas : [],
                  categories: Array.isArray(exercise.categories) && exercise.categories.length > 0
                    ? exercise.categories
                    : ["Main Workout"]
                },
                sets,
                reps,
                locked: Boolean(item.locked),
                block: typeof item.block === "string" ? item.block : "Main"
              };
            })
            .filter(Boolean)
        };
      })
      .filter((entry) => entry && entry.items.length > 0);
  }

  function loadActiveWorkout() {
    const raw = localStorage.getItem(STORAGE_KEYS.activeWorkout);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      const items = parsed.items
        .map((item) => {
          if (!item || typeof item !== "object" || !item.exercise) return null;
          const sets = Number.parseInt(String(item.sets), 10);
          const reps = Number.parseInt(String(item.reps), 10);
          const completedSets = Number.parseInt(String(item.completedSets), 10);
          if (Number.isNaN(sets) || Number.isNaN(reps) || Number.isNaN(completedSets)) return null;
          return {
            exercise: {
              id: String(item.exercise.id || ""),
              name: String(item.exercise.name || ""),
              equipment: Array.isArray(item.exercise.equipment) ? item.exercise.equipment : [],
              bodyAreas: Array.isArray(item.exercise.bodyAreas) ? item.exercise.bodyAreas : [],
              categories: Array.isArray(item.exercise.categories) && item.exercise.categories.length > 0
                ? item.exercise.categories
                : ["Main Workout"]
            },
            sets,
            reps,
            completedSets: Math.max(0, Math.min(sets, completedSets))
          };
        })
        .filter(Boolean);
      if (items.length === 0) return null;
      return {
        startedAt: String(parsed.startedAt || new Date().toISOString()),
        currentExerciseIndex: clampInt(parsed.currentExerciseIndex, 0, Math.max(0, items.length - 1), 0),
        items
      };
    } catch (_error) {
      return null;
    }
  }

  function persistActiveWorkout() {
    if (!state.activeWorkout) {
      localStorage.removeItem(STORAGE_KEYS.activeWorkout);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.activeWorkout, JSON.stringify(state.activeWorkout));
  }

  function renderHistory() {
    elements.historyList.innerHTML = "";
    if (state.workoutHistory.length === 0) {
      elements.historyList.innerHTML = `<p class="muted">Ingen historik endnu.</p>`;
      return;
    }

    state.workoutHistory.forEach((entry, index) => {
      const card = document.createElement("article");
      card.className = "workout-card";
      const timeLabel = new Date(entry.createdAt).toLocaleString("da-DK");
      const summary = entry.items
        .map((item, i) => {
          const isTimedSection = item.block === "Warm-Up" || item.block === "Stretching";
          const detail = isTimedSection ? `${item.sets}x${item.reps}s` : `${item.sets}x${item.reps}`;
          return `${i + 1}. ${item.exercise.name} (${detail})`;
        })
        .join("<br>");
      card.innerHTML = `
        <h3 class="exercise-name">Workout #${state.workoutHistory.length - index}</h3>
        <p class="meta">${escapeHtml(timeLabel)}</p>
        <p class="meta">${summary}</p>
        <div class="workout-actions">
          <button type="button" class="secondary small" data-history-action="load" data-history-index="${index}">Indlaes</button>
          <button type="button" class="danger small" data-history-action="delete" data-history-index="${index}">Slet</button>
        </div>
      `;
      elements.historyList.appendChild(card);
    });

    elements.historyList.querySelectorAll("[data-history-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-history-action");
        const index = Number.parseInt(button.getAttribute("data-history-index") || "", 10);
        if (Number.isNaN(index)) return;
        if (action === "load") {
          const entry = state.workoutHistory[index];
          if (!entry) return;
          state.generatedWorkout = entry.items.map((item) => ({
            exercise: item.exercise,
            sets: item.sets,
            reps: item.reps,
            locked: Boolean(item.locked),
            block: typeof item.block === "string" ? item.block : "Main"
          }));
          persistGeneratedWorkout();
          switchTab("generator");
          renderGeneratedWorkout();
        } else if (action === "delete") {
          state.workoutHistory.splice(index, 1);
          localStorage.setItem(STORAGE_KEYS.workoutHistory, JSON.stringify(state.workoutHistory));
          renderHistory();
        }
      });
    });
  }

  function clearAllHistory() {
    const shouldClear = window.confirm("Er du sikker på at du vil slette al historik?");
    if (!shouldClear) return;
    state.workoutHistory = [];
    localStorage.setItem(STORAGE_KEYS.workoutHistory, JSON.stringify([]));
    renderHistory();
  }

  function duplicateGeneratedWorkoutItem(index) {
    const original = state.generatedWorkout[index];
    if (!original) return;
    state.generatedWorkout.splice(index + 1, 0, {
      exercise: original.exercise,
      sets: original.sets,
      reps: original.reps,
      locked: false,
      block: original.block || "Main"
    });
    persistGeneratedWorkout();
    renderGeneratedWorkout();
  }

  function moveGeneratedWorkoutItem(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= state.generatedWorkout.length) return;
    if (toIndex < 0 || toIndex >= state.generatedWorkout.length) return;
    const [item] = state.generatedWorkout.splice(fromIndex, 1);
    state.generatedWorkout.splice(toIndex, 0, item);
    persistGeneratedWorkout();
    renderGeneratedWorkout();
  }

  function wireDragAndDrop() {
    let dragFromIndex = null;
    elements.generatedWorkout.querySelectorAll("[data-drag-index]").forEach((card) => {
      card.addEventListener("dragstart", () => {
        dragFromIndex = Number.parseInt(card.getAttribute("data-drag-index") || "", 10);
      });
      card.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      card.addEventListener("drop", () => {
        const toIndex = Number.parseInt(card.getAttribute("data-drag-index") || "", 10);
        if (Number.isNaN(dragFromIndex) || Number.isNaN(toIndex)) return;
        if (dragFromIndex === toIndex) return;
        moveGeneratedWorkoutItem(dragFromIndex, toIndex);
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function findExerciseByName(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return null;
    return (
      state.exercises.find((exercise) => exercise.name.toLowerCase() === normalized) ||
      state.exercises.find((exercise) => exercise.name.toLowerCase().includes(normalized)) ||
      null
    );
  }

  function getDemoSearchUrl(exerciseName) {
    const query = `${exerciseName} exercise tutorial`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
})();

