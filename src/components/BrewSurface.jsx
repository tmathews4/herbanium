/* ──────────────────────────────────────────────────────────────
   components/BrewSurface.jsx — THE brew page. One of them.

   Three screens show a brew page: the composer, a saved recipe, an
   ingredient's Brewing tab. They were three assemblies of the same
   parts, each deciding for itself which props to pass, and they drifted
   exactly as far as you'd expect:

     - the composer shaved 2px of padding (`compact`) so it alone
       looked different;
     - the recipe panel was UNCONTROLLED, so its sliders moved, its
       strips responded, and Brew started the saved temperature anyway;
     - two of the three shipped with no Brew button at all, because the
       button lived at the one call site that remembered to pass it.

   None of those were decisions. They were three copies of the same
   knowledge, each drifting on its own schedule — the shape this
   codebase keeps producing (four Google Fonts <link> tags, the tour
   pulse on a wrapper, eleven test call sites that each knew how to
   brew).

   So the page is defined ONCE and takes a LOAD. Open it from an
   ingredient and it's the brew page with that leaf selected, starting
   on its recommended range. Open it from a recipe and it's the brew
   page with that recipe's leaves, name, temperature and time. Open it
   from the composer and it's the same page with nothing in it yet.

   WHAT VARIES IS THE LOAD, NOT THE PAGE. Everything a host used to
   decide is derived here instead:

     - the name prompt appears only when the load HAS no name, which is
       exactly the composed-pot case. A recipe already has one.
     - `curated` / `experimental` come from what the blend IS, not from
       which screen is showing it. They change which WARNINGS fire — a
       curated recipe sitting on its designed brew point shouldn't shout
       about over-pull, a user-built blend has no baseline to sit on —
       and that distinction is earned, unlike the padding.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useEffect } from "react";
import { BlendExtractionExplorer } from "./BlendExtractionExplorer";
import { BrewCornerButton, SaveCornerButton } from "./BrewButton";
import { suggestBlendName } from "../helpers/misc";

/**
 * @param load  { ingredients, name?, tempC?, timeS?, kind? }
 *   kind: "recipe" (curated, has a name) | "ingredient" | "blend"
 *         (user-built, unnamed). Defaults to "blend".
 * @param onBrew  (blend) => void — receives the cup AS DIALLED, with
 *   the name from the prompt when one was asked for.
 */
export const BrewSurface = ({
  load,
  onBrew,
  // Hosts that need the live values for their own purposes (the
  // composer's save flow, its "at 94°" prose) pass their own state in
  // and stay in control. Everyone else lets this hold it — which is
  // what makes "controlled" the default rather than something each
  // screen has to remember.
  tempC: tempCProp,
  setTempC: setTempCProp,
  timeS: timeSProp,
  setTimeS: setTimeSProp,
  // Keeping the pot, as opposed to brewing it. Only the composer passes
  // one — a recipe already lives in the catalogue and a single leaf is
  // not a blend — which is the same "what varies is the LOAD" rule the
  // header states: the corner appears because this pot can be kept, not
  // because of which screen is showing it.
  onSave,
  tour = null,
  isTraditional = false,
  isHouse = false,
  ...rest
}) => {
  // `ml` rides on the load with everything else the page varies by: a
  // recipe brings the curator's vessel, the composer brings the pour
  // size the user picked, an ingredient page is a plain 200ml cup.
  // Absent means 200ml, which is what every profile is written per.
  const { ingredients = [], name = "", tempC: loadTempC, timeS: loadTimeS, kind = "blend", ml } = load || {};

  const [ownTempC, setOwnTempC] = useState(loadTempC);
  const [ownTimeS, setOwnTimeS] = useState(loadTimeS);
  // Re-seed when the load changes. Screens swap what they're showing
  // without remounting — walking to a paired ingredient, opening
  // another recipe — and a useState initialiser only runs once, so
  // without this the new load inherits the previous one's brew.
  useEffect(() => {
    if (loadTempC != null) setOwnTempC(loadTempC);
    if (loadTimeS != null) setOwnTimeS(loadTimeS);
  }, [loadTempC, loadTimeS]);

  const controlled = tempCProp !== undefined && setTempCProp !== undefined;
  const tempC = controlled ? tempCProp : ownTempC;
  const setTempC = controlled ? setTempCProp : setOwnTempC;
  const timeS = (timeSProp !== undefined && setTimeSProp) ? timeSProp : ownTimeS;
  const setTimeS = (timeSProp !== undefined && setTimeSProp) ? setTimeSProp : setOwnTimeS;

  return (
    <BlendExtractionExplorer
      ingredients={ingredients}
      ml={ml}
      defaultTempC={loadTempC}
      defaultTimeS={loadTimeS}
      tempC={tempC}
      setTempC={setTempC}
      timeS={timeS}
      setTimeS={setTimeS}
      // From what the blend IS, not from which screen is showing it.
      curated={kind === "recipe"}
      experimental={kind === "blend"}
      isTraditional={isTraditional}
      isHouse={isHouse}
      tourStep={tour?.step}
      familyModeOverride={tour?.familyMode}
      controlsOpenOverride={tour?.controlsOpen}
      axisOverride={tour?.axis}
      saveAction={onSave ? (
        <SaveCornerButton
          disabled={!ingredients.length}
          // NOT pre-seeded, even where the load has a name. Saving from
          // a recipe or a leaf makes YOUR copy of it, and handing back
          // the original's name produces two catalogue rows reading the
          // same — the duplicate-by-default problem "Untitled blend"
          // had, wearing a nicer word.
          onSave={onSave}
        />
      ) : null}
      brewAction={onBrew ? (
        <BrewCornerButton
          disabled={!ingredients.length}
          pulsing={tour?.step === "blend-brew"}
          // Asks first, everywhere — but only whether to brew. Naming
          // belongs to the Save corner now; a composed pot with no name
          // brews under a description of itself rather than the
          // "Untitled blend" this used to fall back to.
          confirm
          onConfirm={() => onBrew({
            ...load,
            name: name || suggestBlendName(ingredients),
            ingredients,
            tempC,
            timeS,
          })}
        />
      ) : null}
      {...rest}
    />
  );
};
