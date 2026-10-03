# Roadmap by Hours (no fixed schedule, you choose when)

You decide when to work. This file tells you **what to do, in what order, and how many focused hours each step needs**.

---

## 1. How to read this

- **Hours** = typical *focused* hours for a first-timer, including normal debugging. Not "watching on 2x".
- **Needs** = parent steps. Do not start a step until every step in its **Needs** list is done (gate ticked).
- **Done when** = the proof. A file in a repo, a recording, a screenshot, or you explaining it without notes.
- IDs are per track: `ML` (AI/ML), `RB` (Robotics), `DW` (Design/Web), `VD` (Video/Social), `JB` (Resume/Jobs).
- **(opt)** = optional. Skip first if you fall behind.
- Tracks run in parallel. Being blocked in one track never blocks the others.

### The rules
1. **Gate rule:** no starting a step before its parents are done.
2. **2x rule:** if a step takes twice its hours, stop. Write down what blocks you. Do the *minimum pass* (the smallest version of "done when"), then move on and come back later.
3. **Habits** (not counted in step hours):
   - Review: 15 min every working day (what I finished, what blocks me, tomorrow's top 3). 1 hour on your rest day.
   - Coding practice: 30 min/day from Phase 2 (2 easy problems in Python).
   - `git push` at the end of every working day.
   - Post one clip roughly every 4-5 working days once you reach Phase 2.
4. **Rest day:** keep at least 1 day a week completely off.

### Cut order (if you fall behind, cut from the top)
R4 humanoid RL → LoRA → multi-robot / hardware clip → camera calibration → dashboard design → Lighthouse 90+ stretch.
**Never cut:** R1, R2, the thermal project, the portfolio site, resume updates, applications.

---

## 2. Total time at a glance

### Core hours by phase and track

| Phase | AI/ML | Robotics | Design/Web | Video | Resume/Jobs | **Total** |
|---|---|---|---|---|---|---|
| 0 Setup | 0 | 2.5 | 2 | 0.3 | 1.3 | **6.1** |
| 1 Foundations | 22.5 | 31 | 8 | 11.5 | 0 | **73** |
| 2 Core builds | 15.5 | 10.5 | 7 | 4.5 | 3 | **40.5** |
| 3 Research flagship | 28.5 | 21.5 | 5 | 10 | 5.5 | **70.5** |
| 4 LLMs & deploy | 22.5 | 12 | 4 | 6 | 3 | **47.5** |
| 5 Finish | 7.5 | 12 | 4 | 8.5 | 21 | **53** |
| **Total** | **96.5** | **89.5** | **30** | **40.8** | **33.8** | **≈ 291 h** |

Add about **10% buffer** (≈ 29 h) and the daily habits (≈ 35 h): **about 355 hours in total**.
Optional extras (R4 humanoid RL 6-8 h, hardware clip 3 h, etc.) are on top of that.

### How long it takes at different daily paces (6 working days/week)

| Focused hours per day | Working days | Calendar time |
|---|---|---|
| 6 h | ≈ 59 | ≈ 10 weeks |
| 8 h | ≈ 44 | ≈ 7.5 weeks |
| 10 h | ≈ 36 | ≈ 6 weeks |
| 12 h | ≈ 30 | ≈ 5 weeks (hard to sustain) |

Calendar time doesn't include exam breaks. If you pause, just resume at the same step.

### How to split an 8-hour focused day (by phase)

| Phase | AI/ML | Robotics | Design/Web | Video | Resume/Jobs |
|---|---|---|---|---|---|
| 1 | 2.5 h | 3.4 h | 0.9 h | 1.3 h | 0 |
| 2 | 3.1 h | 2.1 h | 1.4 h | 0.9 h | 0.6 h |
| 3 | 3.2 h | 2.4 h | 0.6 h | 1.1 h | 0.6 h |
| 4 | 3.8 h | 2.0 h | 0.7 h | 1.0 h | 0.5 h |
| 5 | 1.1 h | 1.8 h | 0.6 h | 1.3 h | 3.2 h |

For a different daily total, scale these proportionally. Don't worry about hitting exact numbers daily; just keep the *tracks* roughly in this proportion over the phase.

---

# PHASE 0: SETUP (≈ 6 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| JB-01 | Project audit: list every project, what it does, tech, link, one measurable number | 0.3 | none | List with a number (or "none yet") for each project |
| JB-02 | Resume v0: one page, header, 2-line summary, projects, skills, education. Bullets = action + result + number | 0.75 | JB-01 | One-page PDF exported |
| RB-01 | Environment: check `lsb_release -a`. Ubuntu 24.04 needed for ROS 2 Jazzy. Dual boot or WSL2 if you're not on it. Free 40+ GB disk | 1.5 (up to 4 if installing an OS) | none | `lsb_release -a` shows Ubuntu 24.04 |
| RB-02 | Install ROS 2 Jazzy (apt, `ros-jazzy-desktop`), add `source` line to `~/.bashrc` | 1 | RB-01 | `talker` and `listener` demo nodes exchange messages |
| DW-01 | Tracker: secrets check (`grep -rniE "sk-\|api[_-]?key\|secret\|token" api/ src/`), push (`--force-with-lease` after checking the remote), deploy on Vercel, README with screenshots | 0.75 | none | Live URL, README with screenshots, no secrets in the repo |
| DW-02 | GitHub cleanup: photo, bio, pin best 3-6 repos, proper README for your best project, create `ml-learning` repo | 0.75 | JB-01 | Profile looks finished, `ml-learning` exists |
| JB-03 | LinkedIn headline: *Robotics & AI/ML Developer \| ROS 2 · PyTorch · Computer Vision* + summary | 0.25 | JB-02 | Headline and summary updated |
| DW-03 | Placeholder portfolio page: name, headline, 3 projects, resume PDF, links | 0.5 | DW-01, JB-02 | Live URL with resume linked |
| VD-01 | Install DaVinci Resolve and open a clip | 0.3 | none | A clip plays |

**Phase 0 exit gate:** resume v0, tracker live, GitHub cleaned, Ubuntu 24.04 + ROS 2 working, placeholder site live.

---

# PHASE 1: FOUNDATIONS (≈ 73 h)

## AI/ML (22.5 h): data tools and classical ML

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| ML-01 | Python env: venv, Jupyter, Git basics; first commit to `ml-learning` | 1 | DW-02 | A notebook pushed to GitHub |
| ML-02 | Linear algebra intuition: 3Blue1Brown episodes 1-4, one page of notes | 1.5 | none | You can explain why AB ≠ BA with rotate/shear |
| ML-03 | NumPy: arrays, indexing, broadcasting, matrix ops. Notebook with 10 exercises (one is a 2x2 rotation on points) | 2.5 | ML-01, ML-02 | Notebook runs top to bottom |
| ML-04 | pandas I: reading, indexing, summary functions, maps (Kaggle Learn) | 1.5 | ML-03 | Notebook answering 5 questions on one dataset |
| ML-05 | pandas II: missing values, dtypes, groupby, merge. Save a cleaned CSV and a "what I changed" list | 1.5 | ML-04 | Cleaned dataset + change list |
| ML-06 | Matplotlib: bar, histogram, scatter/line with labels | 1 | ML-05 | 3 saved charts in the repo |
| ML-07 | Calculus: 3Blue1Brown *Essence of Calculus* 1-4, Khan partial derivatives and gradient. f(x,y)=x²y+3y by hand, check with finite differences | 1.5 | ML-02, ML-03 | Hand result = numeric result to 4 decimals |
| ML-08 | Probability/stats: mean, variance, distributions, conditional probability, Bayes' rule. 5 problems (one Bayes) | 1.5 | ML-03 | 5 solved problems + explain a false-positive test |
| ML-09 | Linear/logistic regression with scikit-learn; train/test split; write a leakage note with a code example | 1.5 | ML-05, ML-07, ML-08 | A model with a test score + demonstrated leakage |
| ML-10 | Decision trees and random forests; vary `max_depth` | 1.5 | ML-09 | Comparison table + overfitting plot |
| ML-11 | Overfitting, bias-variance, 5-fold CV; metrics (accuracy, precision, recall, F1, ROC-AUC, confusion matrix) | 1.5 | ML-10 | Cross-validated scores for 3 models + validation curve |
| ML-12 | One evaluation report: metrics table, confusion matrix, 3 sentences on errors | 1.5 | ML-11 | Report pushed |
| ML-13 | Mini-project: Kaggle tabular dataset, clean, 3 models compared, README write-up (problem, data, results, limits) | 4 | ML-11 | Write-up on GitHub with a results table |

## Robotics (31 h): Robot R1 (service robot)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| RB-03 | ROS 2 CLI with turtlesim: nodes, topics, services, `rqt_graph` | 1.5 | RB-02 | Drive turtle, echo pose, spawn a second turtle with a service call |
| RB-04 | Workspace (`colcon build`) + Python package with publisher and subscriber | 1.5 | RB-03 | Subscriber prints publisher's messages |
| RB-05 | Install Gazebo Harmonic + `ros-jazzy-ros-gz`; open an example world | 1.5 | RB-04 | Example world opens |
| RB-06 | Build a Gazebo world (cafe) in SDF: ground, walls, tables/shelves | 1.5 | RB-05 | World launches with furniture |
| RB-07 | Spawn TurtleBot3 (per Jazzy docs), bridge topics, view lidar + camera in rviz2 | 1.5 | RB-06 | Sensors visible, teleop moves the robot |
| RB-08 | One launch file (`r1_bringup`) for world + robot + bridge | 1.5 | RB-07 | One command brings up everything |
| RB-09 | SLAM with `slam_toolbox`; drive around; save map with `map_saver_cli` | 1.5 | RB-08 | `.pgm` + `.yaml` map matches the world |
| RB-10 | Nav2 bringup with the saved map; 2D Pose Estimate; click a goal | 1.5 | RB-09 | Robot reaches a clicked goal |
| RB-11 | Script 3 goals with `nav2_simple_commander` | 1.5 | RB-10 | Prints success/fail for 3 named locations |
| RB-12 | Tune costmap/inflation (`inflation_radius`, `cost_scaling_factor`, `robot_radius`), one change at a time | 1.5 | RB-11 | Notes with 3+ experiments and effects |
| RB-13 | YOLO person-detection node (Ultralytics, class 0 = person) with annotated image | 1.5 | RB-08 | Box around a person model in rviz2 |
| RB-14 | Bearing = (cx − w/2)/w × FOV; distance from lidar at that bearing; publish to `/person/relative_position` | 2 | RB-13 | Values change plausibly when the person moves |
| RB-15 | Follow controller: P/PID on bearing and distance, target 1.5 m, clamp velocities | 1.5 | RB-14 | Robot follows a person in sim |
| RB-16 | Safety stop: distance < 0.6 m, detection lost > 1 s, lidar obstacle ahead | 1.5 | RB-15 | Stops in all 3 cases in 3 test runs |
| RB-17 | State machine: IDLE, GO_TO, FOLLOW, RETURN (Python enum or `py_trees`) | 2 | RB-16, RB-11 | State diagram + a run through 3+ states |
| RB-18 | Fetch command on `/fetch_command` (go, wait, return) | 1.5 | RB-17 | One message triggers the full cycle |
| RB-19 | Integration test: run follow → go-to → return 5 times, log failures | 1.5 | RB-18 | 4 of 5 runs succeed |
| RB-20 | R1 README: description, architecture diagram, how to run, limits | 1.5 | RB-19 | Tested from a fresh clone |
| RB-21 | Clean launch files + YAML params, limitations section, tag `v1.0` | 3 | RB-20 | Public repo with tag v1.0 |

## Design/Web (8 h): design the portfolio in Figma

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| DW-04 | Design principles (hierarchy, contrast, alignment, proximity, whitespace); notes on 5 sites | 1 | DW-03 | 5-site notes |
| DW-05 | Figma basics: frames, shapes, text, constraints, auto layout; build a card | 1 | DW-04 | Card resizes correctly |
| DW-06 | Color palette (60-30-10, 4.5:1 contrast) + font pair + type scale | 1 | DW-05 | Palette passes contrast; fonts chosen |
| DW-07 | Moodboard + one-page style guide | 1 | DW-06 | Style guide page |
| DW-08 | Sitemap + 5 low-fi wireframes (Home, Projects, Detail, About, Contact) | 1 | DW-07 | Sitemap and 5 wireframes |
| DW-09 | Components + variants: buttons, cards, navigation | 1 | DW-08 | Reusable component set |
| DW-10 | Hi-fi homepage, desktop + mobile | 1 | DW-09 | Two frames |
| DW-11 | Show 2 people ("what is this site for? what would you click first?"), revise | 1 | DW-10 | Revised design + note on changes |

## Video/Social (11.5 h): editing basics and your first post

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| VD-02 | Resolve basics: interface, cut, trim, split, ripple delete; 20-30 s practice edit | 1.5 | VD-01 | Practice edit exported |
| VD-03 | Export at 9:16 (1080x1920) and 16:9 (1920x1080), H.264; reframe for vertical | 1.5 | VD-02 | Two files that play on your phone |
| VD-04 | OBS: scene, 1080p30, audio levels, clean capture (large fonts, hide clutter) | 1.5 | VD-03 | A clean 20-30 s rviz2/Gazebo clip |
| VD-05 | Captions: auto-transcribe, fix, style (large, high contrast) | 1.5 | VD-04 | Captioned clip |
| VD-06 | Audio: noise reduction, normalize (~−14 LUFS), licensed music, duck under voice | 1.5 | VD-05 | Clip with clean audio |
| VD-07 | Hooks (first 3 s), pacing, one idea per clip; 30 s script + shot list | 1.5 | VD-06 | Script with timings |
| VD-08 | Record raw R1 footage: full scenario + 3-4 B-roll shots | 1 | RB-19, VD-04 | Raw clips saved and named |
| VD-09 | Edit the R1 demo (30-60 s), export both ratios, post on LinkedIn and Instagram/Shorts with the GitHub link | 1.5 | VD-07, VD-08, RB-21 | First post live, demo added to R1 README |

**Phase 1 exit gate:** ML mini-project written up. R1 works end to end with README. Figma design done. First post live.

---

# PHASE 2: CORE BUILDS (≈ 40.5 h)

## AI/ML (15.5 h): neural networks and CNNs

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| ML-14 | NN theory: 3Blue1Brown NN chapters 1-4; notes with a diagram (neuron, layer, activations) | 1.5 | ML-07 | Explain forward and backward pass without notes |
| ML-15 | Loss + gradient descent from scratch in NumPy: MSE vs cross-entropy, 3 learning rates, SGD vs Adam (concept) | 1.5 | ML-14 | Loss-curve plot for 3 learning rates |
| ML-16 | micrograd: watch Karpathy's video and code along (`Value`, `+`, `*`, `tanh`, `backward`, Neuron/Layer/MLP); train on a toy dataset; check against PyTorch autograd | 5 | ML-15 | MLP trains with a decreasing loss, decision boundary plot, pushed |
| ML-17 | PyTorch basics: tensors, autograd, `nn.Module`; rebuild the micrograd network | 1.5 | ML-16 | Same task, same-shaped loss curve |
| ML-18 | Training loop: `Dataset`, `DataLoader`, optimizer, loss; reusable `train.py` with args | 1.5 | ML-17 | `python train.py --lr 0.01 --epochs 5` works |
| ML-19 | MNIST on Colab: dropout, batch norm; table of what each did; break training on purpose and write why | 1.5 | ML-18 | Results table + failure note |
| ML-20 | CNN theory (convolution, kernel, padding, stride, pooling); hand-compute one convolution; small CNN on Fashion-MNIST | 1.5 | ML-19 | Hand result = PyTorch result; reported test accuracy |
| ML-21 | Transfer learning with a pretrained ResNet; compare scratch vs transfer vs transfer + augmentation | 1.5 | ML-20 | Comparison table |

## Robotics (10.5 h): C++ basics and Robot R2 (warehouse)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| RB-22 | C++ basics: variables, functions, references, pointers (learncpp.com) | 1 | RB-04 | Program computing a mean; explain reference vs pointer |
| RB-23 | R2 warehouse world: shelves, aisles (1.2-1.5 m), pick and drop zones | 1.5 | RB-21 | World launches with zones marked |
| RB-24 | URDF reading + R2 robot model (base, wheels, payload platform, sensors) | 2 | RB-23 | Spawns, complete TF tree in rviz2, teleop works |
| RB-25 | C++ classes and constructors | 1 | RB-22 | A class that compiles and runs |
| RB-26 | SLAM-map the warehouse | 0.5 | RB-24 | Saved map |
| RB-27 | Zone waypoints (pick, drop, aisle entry/exit) in a YAML file | 1.5 | RB-26 | Waypoint file loads in Nav2 |
| RB-28 | C++ STL: `vector`, strings, loops | 1 | RB-25 | Program using `std::vector` |
| RB-29 | Nav2 `FollowWaypoints` from pick zone to drop zone | 1.5 | RB-27 | Route completed at least once |
| RB-30 | Narrow-aisle tuning (inflation, footprint, recoveries) | 0.5 | RB-29 | Navigates an aisle without clipping shelves |

## Design/Web (7 h): build the portfolio

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| DW-12 | HTML (semantic tags, links, images, forms) + CSS (box model, selectors, colors, type) | 2 | DW-11 | Styled homepage skeleton pushed |
| DW-13 | Flexbox, Grid, media queries, relative units; project card grid | 1.5 | DW-12 | Grid reflows on phone and desktop |
| DW-14 | Turn the Figma homepage into code | 1 | DW-13 | Matches design at desktop and mobile |
| DW-15 | Deploy on GitHub Pages or Vercel | 1 | DW-14 | Live URL replacing the placeholder |
| DW-16 | JavaScript basics (variables, functions, DOM, events); mobile menu + project filter; run Lighthouse and note scores | 1.5 | DW-15 | Menu and filter work; scores written down |

## Video (4.5 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| VD-10 | Transitions and keyframes (zoom, position, speed ramps) | 1.5 | VD-09 | Practice clip with a zoom and a smooth transition |
| VD-11 | Text animation, lower thirds (Fusion basics); 2 thumbnails in Figma | 1.5 | VD-10 | A titled clip + 2 thumbnails |
| VD-12 | Post #2: 20-30 s clip about your portfolio site or tracker | 1.5 | VD-11, DW-15 | Post live |

## Resume/Jobs (3 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| JB-04 | Resume v1: R1, mini-project, tracker + best older projects; ATS-safe and designed versions; portfolio link; LinkedIn updated | 1.5 | ML-13, RB-21, DW-15 | Two PDFs, every bullet has a number |
| JB-05 | Application setup: 20 target companies/labs, 5 job boards, tracking sheet | 0.5 | JB-04 | List and sheet exist |
| JB-06 | First 3 applications, tailored first paragraph | 1 | JB-05 | 3 logged |

**Phase 2 exit gate:** site live. Resume v1 done. First applications sent. You've trained MNIST, a CNN and a transfer-learning model. R2 completes a waypoint route.

---

# PHASE 3: RESEARCH FLAGSHIP (≈ 70.5 h)

Project: **thermal-image classification/detection with a CNN backbone + transformer encoder.**

## AI/ML (28.5 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| ML-22 | Attention + ViT notes: queries/keys/values, scaled dot-product, multi-head, positional encoding (*The Illustrated Transformer*) | 1.5 | ML-20 | Explain attention without notes; hand-drawn encoder block |
| ML-23 | Literature review (5-8 papers) + 1-page brief: problem, metric, target, baseline | 1.5 | ML-22 | One-page brief with 5+ cited papers |
| ML-24 | Choose dataset (Kaggle, Roboflow Universe, Papers with Code); check license; download | 1 | ML-23 | License noted in the repo |
| ML-25 | `Dataset` class, EDA, stratified split (split by scene if frames come from videos) | 1.5 | ML-24 | EDA notebook + documented split |
| ML-26 | Simple CNN baseline | 1.5 | ML-25 | Baseline metrics table |
| ML-27 | Baseline tuning: 3 settings (lr, augmentation, input size), logged with seeds | 2 | ML-26 | Experiment table |
| ML-28 | Pretrained baseline (ResNet/EfficientNet via `torchvision` or `timm`) | 1.5 | ML-27, ML-21 | Table with 2 models |
| ML-29 | Evaluation script: precision, recall, F1, confusion matrix, per class (mAP if detection) | 1.5 | ML-28 | `python evaluate.py` reports for any saved model |
| ML-30 | Hybrid design: CNN backbone → tokens → small transformer encoder → head; check shapes | 1.5 | ML-29, ML-22 | Forward pass runs, shapes documented |
| ML-31 | Train hybrid; compare with baselines (same split, seeds, epochs) | 1.5 | ML-30 | 3-model table |
| ML-32 | Hybrid tuning (depth, heads, dropout) | 2 | ML-31 | At least 3 logged runs |
| ML-33 | Ablations: with/without transformer, with/without augmentation, 2 input sizes | 3 | ML-32 | Ablation table + 3 sentences on what it shows |
| ML-34 | Error analysis + Grad-CAM on 4-6 failure cases | 1.5 | ML-33 | Failure-case figure with explanations |
| ML-35 | CPU inference latency (warm up, average over 100 runs) | 1 | ML-33 | Latency numbers for baseline and hybrid |
| ML-36 | Write the report: intro, related work, method, experiments, results, limitations; figures; proofread | 5 | ML-34, ML-35 | Paper-style PDF in the repo |

## Robotics (21.5 h): finish R2, harden, polish

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| RB-31 | Custom action `Deliver.action` in an interfaces package (goal: from/to, feedback: progress, result: success) | 1.5 | RB-30 | Server and client exchange goal + feedback |
| RB-32 | Full delivery cycle: pick at A, travel, drop at B, via the action | 1 | RB-31 | One cycle works |
| RB-33 | 5 repeated deliveries; log time, success, failures | 1.5 | RB-32 | Log of 5 runs |
| RB-34 | C++ `rclcpp` publisher; run with your Python subscriber | 1.5 | RB-28, RB-04 | C++ node publishes, Python receives |
| RB-35 | Port the subscriber to C++ and add to `CMakeLists.txt` | 1.5 | RB-34 | C++ ↔ Python both directions |
| RB-36 | 30 trials: success rate and average delivery time | 1.5 | RB-33 | Results table |
| RB-37 | R2 demo video + README + publish | 1.5 | RB-36 | Public repo with demo and metrics |
| RB-38 | tf2 static transform + listener; one lifecycle node | 2 | RB-34 | Both work and are documented |
| RB-39 | One test (controller math unit test or a launch test) | 1.5 | RB-38 | Passing test |
| RB-40 | R1 + R2 READMEs: GIFs, architecture diagrams, quick-start | 1.5 | RB-37 | Quick-start tested |
| RB-41 | "Failures and lessons" section in each repo | 1.5 | RB-40 | Written in both repos |
| RB-42 | Pin repos + one-line descriptions + topics | 0.5 | RB-41 | Pinned |
| RB-43 | Clean final demo recordings for R1 and R2 | 1.5 | RB-40 | Final videos |
| RB-44 | (opt) Run R1 on real TurtleBot3 hardware, or two namespaced robots in sim | 3 | RB-37 | One clip |

## Design/Web (5 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| DW-17 | Case-study layout (problem, approach, results, lessons) + R1 case study | 1 | DW-16, RB-21 | R1 case study live |
| DW-18 | R2 case study | 2 | DW-17, RB-37 | Live |
| DW-19 | Thermal project case study | 1 | DW-17, ML-36 | Live |
| DW-20 | (opt) Robot dashboard design in Figma (status, map, controls) | 1 | DW-09 | Dashboard screens |

## Video (10 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| VD-13 | R2 teaser (20-30 s), post | 1.5 | RB-29, VD-11 | Live |
| VD-14 | Hero reel storyboard (60 s: R1, R2, thermal, site, tracker) | 1.5 | VD-09 | Storyboard with timings |
| VD-15 | Collect and organize clips | 1 | VD-14 | Clip folder |
| VD-16 | Edit the reel: color correction, captions, music; export both ratios | 3 | VD-15 | Published 60 s reel |
| VD-17 | Post on training results (Grad-CAM visuals work well) | 1.5 | ML-34 | Live |
| VD-18 | Thermal explainer clip with charts | 1.5 | ML-36 | Live |

## Resume/Jobs (5.5 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| JB-07 | 5 applications | 1 | JB-06 | 5 logged |
| JB-08 | 5 more applications + follow-ups on earlier ones | 1 | JB-07 | Logged |
| JB-09 | Interview prep: 2 coding problems + 5 ML questions (bias-variance, regularization, metrics) in your own words | 2 | ML-11 | Written answers |
| JB-10 | Resume v2: add R2 (30-trial success rate, delivery time) and thermal (metrics, latency); get feedback from 2 people and apply it | 1.5 | ML-36, RB-37, JB-04 | Resume v2 |

**Phase 3 exit gate:** thermal report in the repo. R2 published with metrics. Resume v2 reviewed. 15+ applications sent.

---

# PHASE 4: LLMs & DEPLOY (≈ 47.5 h)

## AI/ML (22.5 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| ML-37 | Embeddings, tokenization, chunking (Hugging Face NLP course); nearest-neighbor experiment | 1.5 | ML-18 | A query retrieves the right sentence; explain chunk size effects |
| ML-38 | Vector DB (FAISS or Chroma): index 100 chunks, 5 queries, top-3 with scores | 1.5 | ML-37 | Working top-k search |
| ML-39 | Prompting + structured outputs; LangChain loader, splitter, retriever, chain; tiny RAG on 5 docs | 2 | ML-38 | Answer plus its source document |
| ML-40 | Collect your 85 papers in one folder + metadata CSV (title, year, source, path) | 1 | none | Folder and CSV |
| ML-41 | Ingest: parse PDFs, chunk (500-800 tokens with overlap), embed, keep page numbers | 1.5 | ML-39, ML-40 | Index with title/page metadata |
| ML-42 | Q&A with citations to paper title and page | 1.5 | ML-41 | 5 questions with correct citations |
| ML-43 | Eval set of 30-50 questions with correct source; hit rate@k, MRR; hand-score faithfulness on 10 answers | 3 | ML-42 | Metrics table |
| ML-44 | FastAPI endpoint for the thermal model (image in → class + confidence), Pydantic validation | 1.5 | ML-36 | Working local API + example request |
| ML-45 | ONNX export, ONNX Runtime check against PyTorch, latency (quantize optional) | 1.5 | ML-44 | ONNX file + latency table |
| ML-46 | Dockerfile, run locally, deploy on Hugging Face Spaces or Render | 3 | ML-45 | Public demo link |
| ML-47 | READMEs + model cards for all ML repos | 1.5 | ML-46, ML-43 | All ML repos complete |
| ML-48 | (opt) LoRA: concepts + fine-tune a small open model; compare base vs RAG vs fine-tuned on the eval set | 3 | ML-43 | Comparison table |

## Robotics (12 h): R3 medical arm preparation

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| RB-45 | Refine your 4-DOF arm URDF: names, joint limits, inertias; view with `joint_state_publisher_gui` | 1.5 | RB-24 | Every joint moves within limits, no TF errors |
| RB-46 | Install MoveIt 2 for Jazzy; first tutorials with the demo robot | 1.5 | RB-45 | Planned and executed a motion in rviz2 |
| RB-47 | MoveIt Setup Assistant for your arm; planning group | 1.5 | RB-46 | Arm plans and moves in rviz2 |
| RB-48 | Send pose goals from Python or C++ | 1.5 | RB-47 | Script moves the arm to 3 poses |
| RB-49 | Collision objects (table, box); plan around the box | 1.5 | RB-48 | Plan avoids the obstacle |
| RB-50 | (opt) Camera calibration (OpenCV chessboard) notes | 1.5 | RB-47 | Calibration notes |
| RB-51 | Fresh-clone test of every robotics repo; fix what breaks | 3 | RB-43 | All repos pass |

## Design/Web (4 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| DW-21 | About + Contact pages | 1 | DW-16 | Live |
| DW-22 | CSS transitions + subtle scroll animations | 1 | DW-16 | Added, no performance loss |
| DW-23 | Mobile testing, image optimization, alt text, focus states (Lighthouse 90+ as a stretch) | 1 | DW-22 | Scores noted, fixes applied |
| DW-24 | RAG case study | 1 | ML-43 | Live |

## Video (6 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| VD-19 | Pin best clips on LinkedIn; embed hero reel on the site | 1.5 | VD-16, DW-21 | Visible in both places |
| VD-20 | RAG demo clip | 1.5 | ML-42 | Posted |
| VD-21 | Deployed-model demo clip | 1.5 | ML-46 | Posted |
| VD-22 | "How I built it" breakdown video | 1.5 | VD-21 | Posted |

## Resume/Jobs (3 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| JB-11 | Resume v3: add RAG (hit rate, MRR) and deployed model (latency); one ML version and one robotics version; send 5 applications with the right version | 3 | JB-10, ML-47, ML-43 | Two tailored resumes, 5 applications logged |

**Phase 4 exit gate:** public deployed demo. RAG metrics table. Resume v3 (2 versions). 30+ applications sent in total.

---

# PHASE 5: FINISH (≈ 53 h, plus buffer)

## AI/ML (7.5 h): paper

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| ML-49 | Polish the paper; decide arXiv or a student workshop (arXiv may need an endorsement; ask your research guide early) | 1.5 | ML-36 | Decision made, template downloaded |
| ML-50 | Move to the venue template; BibTeX references; figures readable | 1.5 | ML-49 | Draft in the template |
| ML-51 | Submission-ready PDF | 1.5 | ML-50 | PDF with references and figures |
| ML-52 | Send to your research guide with specific questions; apply the feedback | 1.5 | ML-51 | Feedback applied |
| ML-53 | Submit (or write a clear next step if the deadline is later) | 1.5 | ML-52 | Submitted |

## Robotics (12 h): R3 medical arm

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| RB-53 | Object detection → 3D pose (simple colored objects; depth camera or known table height) | 1.5 | RB-49 | Pose published for one object |
| RB-54 | Grasp planning: arm reaches a pre-grasp pose above the object | 1.5 | RB-53 | Reaches pre-grasp |
| RB-55 | Pick-and-place pipeline: detect → plan → grasp → place | 3 | RB-54 | One successful end-to-end run in sim |
| RB-56 | 10 trials, record success rate | 1.5 | RB-55 | Success-rate table |
| RB-57 | Assistive framing (for example handing items to a patient), README, demo; keep claims honest ("simulation") | 1.5 | RB-56 | Public repo with README and demo |
| RB-58 | R3 polish | 3 | RB-57 | Fresh-clone test passes |
| RB-59 | (opt) R4 humanoid RL: Spinning Up basics → Gymnasium Humanoid with PPO/SAC (Stable-Baselines3) on Colab/Kaggle, one reward change at a time, results + before/after clip. **Time-box 6-8 h**; switch to Walker2d/HalfCheetah if the humanoid doesn't learn | 6-8 | all earlier gates | Write-up and clip |

## Design/Web (4 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| DW-25 | R3 case study | 2 | RB-57 | Live |
| DW-26 | SEO basics: titles, meta tags, social preview image | 1 | DW-21 | LinkedIn link preview looks right |
| DW-27 | Final design + performance review | 1 | DW-26 | Final site |

## Video (8.5 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| VD-23 | R3 clip | 1.5 | RB-55 | Posted |
| VD-24 | Showreel storyboard (90 s) | 1.5 | VD-16 | Storyboard |
| VD-25 | Showreel edit (first cut + final): hook, best shots, results on screen, end card | 4 | VD-24 | Published |
| VD-26 | Pin the showreel on LinkedIn and the site | 1.5 | VD-25 | Pinned and embedded |

## Resume/Jobs/Interview (21 h)

| ID | Step | Hours | Needs | Done when |
|---|---|---|---|---|
| JB-12 | Project explanations: 2 minutes each (problem, method, result, lesson); record yourself | 2 | ML-47, RB-57 | All 5 projects under 2 minutes |
| JB-13 | ML fundamentals Q&A: 15 answers (bias-variance, regularization, metrics, attention, CV) | 1.5 | ML-19 | 15 written answers |
| JB-14 | Robotics Q&A: 15 answers (SLAM vs localization, costmaps, TF, PID, Nav2 architecture) | 1.5 | RB-39 | 15 written answers |
| JB-15 | Mock interview #1 (friend or senior asks about your projects) | 2 | JB-12 | Notes on 3 weak spots + fixes |
| JB-16 | Coding practice block | 1.5 | JB-09 | 4+ problems solved |
| JB-17 | Whiteboard your robot's architecture out loud | 1.5 | RB-58 | Clear 5-minute explanation |
| JB-18 | Mock interview #2 | 2 | JB-15 | Weak spots fixed |
| JB-19 | Final resume: add R3 and final metrics; ATS-safe + designed with a QR code to the portfolio | 1.5 | RB-57, JB-11 | Final PDFs |
| JB-20 | LinkedIn headline/summary + GitHub profile README + pinned repos, all matching the site | 1.5 | JB-19 | All three tell the same story |
| JB-21 | Application pushes (about 4 sessions, tailored, right version, follow ups) | 5 | JB-11 | 50+ applications total, logged |
| JB-22 | Retrospective: what worked, what didn't, what's next | 1 | all | A written page |

### Phase 5 buffer: about 12 h
Use for anything that overran, or the optional R4.

**Final exit gate:** site live and fast, showreel pinned. 5 projects with README, demo and metrics (R1, R2, thermal, RAG/deployed model, R3). Resume (2 versions), LinkedIn and GitHub aligned. 50+ applications sent, with a log of replies.

---

## 3. Using this with your tracker

Your tracker still has the older plan. Either mark non-matching tasks as skipped, or ask me to generate a `tasks.json` that uses these IDs (ML-01 … JB-22) and hours.
For commands, resources and step-by-step how-tos for the early steps, see `Roadmap_Detailed_Plan.md`. Its Weeks 0-10 contain the same content with detailed instructions.
