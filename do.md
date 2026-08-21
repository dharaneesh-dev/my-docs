# Pure Machine Learning — Complete Syllabus

*Classical ML only. Every topic lists the relevant math to cover.*

**Coverage basis.** This syllabus was cross-checked against Stanford **CS229**, *The Elements of Statistical Learning* (**ESL**), and the full **scikit-learn** supervised + unsupervised algorithm catalog, so it aims to be exhaustive for classical ML.

**Notable inclusions:** a dedicated **Optimization for ML** module; **splines / GAMs / LARS / OMP & grouped sparsity / robust & quantile / isotonic / locally-weighted (LOESS) / PCR & PLS** regression; **multi-class, multi-label & ordinal** classification; **kernel ridge, RKHS, RVM**; **MARS**; **Bayesian Model Averaging**; **AIC/BIC/MDL, bootstrap, model-comparison tests, conformal prediction**; **stability selection, multiple testing / FDR, cost-sensitive learning**; **mean-shift, affinity propagation, OPTICS, HDBSCAN, BIRCH, fuzzy c-means, biclustering**; **Factor Analysis, ICA, probabilistic PCA, MDS, Isomap, LLE (+ Hessian/LTSA), Laplacian eigenmaps, diffusion maps, random projection, CCA, dictionary learning / sparse PCA**; a full **Bayesian methods** module (Bayesian regression, ARD, density estimation, **Gaussian Processes**, variational inference, MCMC, non-parametric Bayes, covariance/graphical-lasso estimation); a **Graphical Models & Structured Prediction** module (Bayesian nets, MRFs, **CRFs**, Kalman & particle filters); a **Sequential Decision & Interactive Learning** module (**bandits**, RL, online & active learning); **learning-to-rank, association rule mining, survival analysis, metric learning, multi-task/transfer learning, factorization machines, GARCH/VAR**; and an **Interpretability** module.

---

## Module map

1. Foundations of Learning
2. Optimization for Machine Learning
3. Regression
4. Linear Classification
5. Generative & Instance-Based Classifiers
6. Kernel Methods & Support Vector Machines
7. Decision Trees
8. Ensemble Methods
9. Model Evaluation, Selection & Reliability
10. Feature Engineering & Selection
11. Clustering
12. Dimensionality Reduction & Manifold Learning
13. Probabilistic & Bayesian Methods
14. Graphical Models & Structured Prediction
15. Sequential Decision & Interactive Learning
16. Time-Series & Forecasting
17. Specialized Learning Problems
18. Interpretability of Models

---
---

---
---

## Module 1 — Foundations of Learning

1. **Learning paradigms** — supervised, unsupervised, semi-supervised, self-supervised, reinforcement
   - *Math:* hypothesis space, loss functions, empirical vs. true risk, empirical risk minimization
2. **Statistical decision theory**
   - *Math:* expected loss/risk, Bayes-optimal predictor, Bayes risk, 0-1 / squared / absolute loss
3. **Bias–variance trade-off**
   - *Math:* bias²+variance+irreducible-error decomposition
4. **Overfitting, underfitting & capacity**
   - *Math:* training vs. generalization error, learning curves, double descent
5. **Learning theory**
   - *Math:* PAC learning, VC dimension, Rademacher complexity, uniform convergence & generalization bounds, No-Free-Lunch theorem
6. **Maximum Likelihood & MAP (the unifying principle)**
   - *Math:* likelihood, log-likelihood, priors, MLE vs. MAP, loss ⟺ likelihood correspondence

---
---

## Module 2 — Optimization for Machine Learning

*The methods used to actually train the models below.*

1. **Convex optimization basics**
   - *Math:* convex sets & functions, first/second-order conditions, global vs. local optima
2. **Gradient Descent & variants**
   - *Math:* batch / stochastic / mini-batch GD, convergence rates, learning rate
3. **Accelerated & adaptive optimizers**
   - *Math:* momentum, Nesterov, AdaGrad, RMSProp, Adam, AdamW
4. **Second-order & quasi-Newton methods**
   - *Math:* Newton's method, Hessian, IRLS, BFGS / L-BFGS
5. **Coordinate & proximal methods**
   - *Math:* coordinate descent, subgradients, soft-thresholding / proximal operator (for L1)
6. **Constrained optimization & duality**
   - *Math:* Lagrange multipliers, KKT conditions, primal–dual, weak/strong duality
7. **Expectation–Maximization as optimization**
   - *Math:* evidence lower bound (ELBO), E-step / M-step, monotonic convergence

---
---

## Module 3 — Regression

1. **Linear Regression (OLS)**
   - *Math:* squared-error loss, normal equations, Gauss–Markov theorem, Gaussian-noise / MLE view
2. **Ridge Regression (L2)**
   - *Math:* L2 penalty, closed form, Gaussian prior (MAP), conditioning
3. **Lasso Regression (L1)**
   - *Math:* L1 penalty, sparsity geometry, soft-thresholding, coordinate descent, Laplace prior
4. **Elastic Net**
   - *Math:* combined L1+L2 penalty, mixing parameter
5. **Least Angle Regression (LARS) & regularization paths**
   - *Math:* forward stagewise selection, piecewise-linear coefficient paths
6. **Polynomial & Basis-Function Regression**
   - *Math:* basis expansion, linearity in parameters
7. **Splines & Smoothing Splines**
   - *Math:* piecewise polynomials, knots, B-splines, roughness penalty
8. **Generalized Additive Models (GAM)**
   - *Math:* additive smooth functions, backfitting algorithm
9. **Generalized Linear Models (GLM)**
   - *Math:* exponential family, link functions, IRLS
10. **Robust Regression**
    - *Math:* Huber loss, M-estimators, RANSAC, breakdown point
11. **Quantile Regression**
    - *Math:* pinball/quantile loss, conditional quantiles
12. **Principal Components Regression & Partial Least Squares**
    - *Math:* projection onto latent directions, variance vs. covariance criteria
13. **Orthogonal Matching Pursuit & grouped-sparsity variants**
    - *Math:* greedy sparse recovery, Group Lasso, Fused Lasso, multi-task Lasso
14. **Locally Weighted Regression (LOESS / LWR)**
    - *Math:* non-parametric local fits, kernel weighting, bandwidth
15. **Isotonic (monotonic) Regression**
    - *Math:* order constraints, pool-adjacent-violators algorithm

---
---

## Module 4 — Linear Classification

1. **Logistic Regression**
   - *Math:* sigmoid, log-odds, binary cross-entropy / NLL, gradient derivation, convexity (Hessian)
2. **Softmax / Multinomial Regression**
   - *Math:* softmax function, categorical cross-entropy, gradient w.r.t. logits
3. **Perceptron**
   - *Math:* linear boundary, mistake-driven update, Novikoff convergence theorem, margin
4. **Multi-class strategies**
   - *Math:* one-vs-rest, one-vs-one, error-correcting output codes (ECOC)
5. **Multi-label classification**
   - *Math:* binary relevance, classifier chains, label powerset, Hamming loss
6. **Ordinal regression / classification**
   - *Math:* ordered thresholds, cumulative-link models, proportional odds

---
---

## Module 5 — Generative & Instance-Based Classifiers

1. **Naive Bayes** (Gaussian / Multinomial / Bernoulli)
   - *Math:* Bayes' theorem, conditional independence, MLE estimates, Laplace smoothing, log-space
2. **Gaussian Discriminant Analysis — LDA / QDA**
   - *Math:* multivariate Gaussian, shared vs. per-class covariance, discriminant functions, decision boundaries
3. **k-Nearest Neighbors (k-NN)**
   - *Math:* distance metrics (Euclidean, Manhattan, Minkowski, cosine), majority vote, Cover–Hart bound, curse of dimensionality
4. **Generative vs. Discriminative models**
   - *Math:* modeling P(x,y) vs. P(y|x), asymptotic comparison

---
---

## Module 6 — Kernel Methods & Support Vector Machines

1. **Maximum-Margin Classifier**
   - *Math:* functional vs. geometric margin, hard-margin optimization
2. **Soft-Margin SVM**
   - *Math:* slack variables, hinge loss, the C parameter
3. **The Dual & Support Vectors**
   - *Math:* Lagrangian, KKT conditions, dual formulation
4. **Kernels & RKHS**
   - *Math:* kernel trick, RBF / polynomial kernels, Mercer's theorem, representer theorem, reproducing kernel Hilbert spaces
5. **Kernel Ridge Regression**
   - *Math:* kernelized least squares, dual solution
6. **Support Vector Regression (SVR)**
   - *Math:* ε-insensitive loss
7. **Relevance Vector Machine (RVM)**
   - *Math:* sparse Bayesian kernel model, automatic relevance determination

---
---

## Module 7 — Decision Trees

1. **Classification & Regression Trees (CART)**
   - *Math:* Gini impurity, entropy, information gain, variance reduction (SSE)
2. **ID3 / C4.5**
   - *Math:* gain ratio, handling continuous & missing values
3. **Pruning & regularization**
   - *Math:* cost-complexity pruning, depth / leaf constraints
4. **Multivariate Adaptive Regression Splines (MARS)**
   - *Math:* hinge basis functions, forward/backward passes

---
---

## Module 8 — Ensemble Methods

1. **Bagging (Bootstrap Aggregating)**
   - *Math:* bootstrap sampling, variance-reduction formula (correlation ρ), out-of-bag error
2. **Random Forests**
   - *Math:* feature subsampling / decorrelation, feature importance (impurity, permutation)
3. **Extremely Randomized Trees (Extra-Trees)**
   - *Math:* randomized split thresholds
4. **AdaBoost**
   - *Math:* exponential loss, forward stagewise additive modeling, sample reweighting, learner weight α
5. **Gradient Boosting**
   - *Math:* gradient descent in function space, pseudo-residuals, shrinkage, subsampling
6. **XGBoost / LightGBM / CatBoost**
   - *Math:* second-order Taylor expansion, regularized objective, optimal leaf weight, split gain, histogram / leaf-wise growth, ordered boosting
7. **Stacking & Blending**
   - *Math:* meta-learner, out-of-fold predictions
8. **Bayesian Model Averaging**
   - *Math:* posterior model probabilities, weighted prediction

---
---

## Module 9 — Model Evaluation, Selection & Reliability

1. **Data splitting & cross-validation**
   - *Math:* train/val/test, k-fold, stratified, leave-one-out, nested CV, time-series (walk-forward) CV
2. **Classification metrics**
   - *Math:* confusion matrix, precision, recall, F1, ROC-AUC, PR-AUC, log-loss, Matthews correlation
3. **Regression metrics**
   - *Math:* MSE, RMSE, MAE, R², MAPE and its limits, WAPE, MASE, RMSSE
4. **Ranking metrics**
   - *Math:* NDCG, MAP, MRR, precision@k, recall@k
5. **Information-criteria model selection**
   - *Math:* AIC, BIC, MDL (minimum description length), adjusted R²
6. **Resampling for evaluation**
   - *Math:* bootstrap confidence intervals, .632 estimator, permutation tests
7. **Statistical comparison of models**
   - *Math:* McNemar's test, paired t-test, Wilcoxon signed-rank, DeLong test (AUC)
8. **Probability calibration**
   - *Math:* reliability diagrams, Platt scaling, isotonic regression, Brier score
9. **Conformal prediction (uncertainty quantification)**
   - *Math:* nonconformity scores, coverage guarantees, prediction sets/intervals
10. **Hyperparameter optimization**
    - *Math:* grid / random / Bayesian optimization, successive halving / Hyperband

---
---

## Module 10 — Feature Engineering & Selection

1. **Feature transforms**
   - *Math:* scaling, standardization, normalization, log / Box–Cox / Yeo–Johnson, binning
2. **Categorical encoding**
   - *Math:* one-hot, ordinal, target/mean encoding (leak-safe), frequency, hashing
3. **Feature selection**
   - *Math:* filter (mutual information, chi-square, ANOVA F), wrapper (recursive feature elimination), embedded (L1, tree importance)
4. **Stability selection**
   - *Math:* subsampling + selection frequency thresholds
5. **Multiple testing & false discovery rate (wide data, p ≫ n)**
   - *Math:* Bonferroni, Benjamini–Hochberg FDR, q-values
6. **Imbalanced learning**
   - *Math:* resampling (SMOTE, ADASYN), class weights, threshold moving
7. **Cost-sensitive learning**
   - *Math:* cost matrix, expected-cost minimization, minimizing weighted risk

---
---

## Module 11 — Clustering (Unsupervised)

1. **K-Means & K-Medoids**
   - *Math:* within-cluster sum of squares, Lloyd's algorithm, k-means++ seeding, convergence
2. **Gaussian Mixture Models + EM**
   - *Math:* mixture likelihood, responsibilities (E-step), weighted updates (M-step), likelihood lower bound
3. **Hierarchical / Agglomerative Clustering**
   - *Math:* linkage criteria (single, complete, average, Ward), dendrograms, cophenetic distance
4. **DBSCAN & OPTICS**
   - *Math:* ε-neighborhoods, core points, density-reachability, reachability plots, noise
5. **Mean-Shift**
   - *Math:* kernel density gradient ascent, bandwidth, modes
6. **Affinity Propagation**
   - *Math:* responsibility & availability message passing, exemplars
7. **Spectral Clustering**
   - *Math:* similarity graph, graph Laplacian, eigenvectors, normalized cut
8. **Fuzzy c-Means**
   - *Math:* soft membership, fuzziness exponent, weighted objective
9. **HDBSCAN**
   - *Math:* mutual reachability distance, condensed cluster tree, variable-density clustering
10. **BIRCH**
    - *Math:* clustering feature (CF) tree, incremental/streaming clustering
11. **Biclustering**
    - *Math:* spectral co-clustering, checkerboard structure, simultaneous row/column grouping
12. **Cluster evaluation**
   - *Math:* silhouette, Davies–Bouldin, Calinski–Harabasz, adjusted Rand index, mutual information

---
---

## Module 12 — Dimensionality Reduction & Manifold Learning

1. **Principal Component Analysis (PCA)** & **Probabilistic PCA**
   - *Math:* covariance eigen-decomposition, variance maximization vs. reconstruction error, Eckart–Young theorem, latent Gaussian model
2. **Singular Value Decomposition & Truncated SVD / LSA**
   - *Math:* matrix factorization, low-rank approximation
3. **Kernel PCA**
   - *Math:* kernelized covariance, nonlinear projection
4. **Linear Discriminant Analysis (supervised reduction)**
   - *Math:* between-class / within-class scatter, generalized eigenvalue problem
5. **Factor Analysis**
   - *Math:* latent factors, factor loadings, unique variances, EM estimation
6. **Independent Component Analysis (ICA)**
   - *Math:* statistical independence, non-Gaussianity, negentropy / kurtosis, FastICA
7. **Multidimensional Scaling (MDS)**
   - *Math:* distance preservation, stress minimization, classical (metric) MDS
8. **Isomap**
   - *Math:* geodesic distances on neighborhood graph, MDS on shortest paths
9. **Locally Linear Embedding (LLE) & variants**
   - *Math:* local reconstruction weights, embedding eigenproblem, Modified LLE, Hessian LLE, Local Tangent Space Alignment (LTSA)
10. **Laplacian Eigenmaps / Spectral Embedding & Diffusion Maps**
    - *Math:* graph Laplacian eigenvectors, locality preservation, diffusion distances
11. **t-SNE**
    - *Math:* neighbor probabilities, Student-t kernel, KL divergence
12. **UMAP**
    - *Math:* fuzzy topological graph, cross-entropy layout
13. **Non-negative Matrix Factorization (NMF)**
    - *Math:* non-negativity constraint, multiplicative updates
14. **Matrix Factorization for Collaborative Filtering**
    - *Math:* latent factors, regularized objective, SGD / ALS updates, BPR loss
15. **Random Projection**
    - *Math:* Johnson–Lindenstrauss lemma, Gaussian / sparse random matrices
16. **Canonical Correlation Analysis (CCA)**
    - *Math:* maximally correlated projections of two views, generalized eigenproblem
17. **Dictionary Learning, Sparse Coding & Sparse PCA**
    - *Math:* overcomplete bases, L1-sparse representations, sparse loadings

---
---

## Module 13 — Probabilistic & Bayesian Methods

1. **Bayesian Linear Regression & conjugate priors**
   - *Math:* Gaussian likelihood + Gaussian prior, posterior predictive, conjugacy
2. **Bayesian model selection**
   - *Math:* marginal likelihood (evidence), Bayes factors, Occam's razor
3. **Density Estimation**
   - *Math:* histograms, kernel density estimation (Parzen windows), bandwidth selection
4. **Mixture Models & general EM**
   - *Math:* latent variables, ELBO, E/M steps, convergence
5. **Gaussian Processes**
   - *Math:* GP prior, kernel/covariance functions, posterior mean & variance, marginal likelihood, GP regression/classification
6. **Variational Inference**
   - *Math:* ELBO, mean-field approximation, KL minimization, coordinate ascent VI
7. **Monte Carlo & MCMC**
   - *Math:* importance/rejection sampling, Markov chains, Metropolis–Hastings, Gibbs sampling
8. **Expectation Propagation**
   - *Math:* moment matching, factor approximation
9. **Bayesian Ridge & Automatic Relevance Determination (ARD)**
   - *Math:* hierarchical priors, evidence maximization, per-feature precision
10. **Non-parametric Bayes (infinite mixtures)**
    - *Math:* Dirichlet Process, Chinese Restaurant Process, stick-breaking
11. **Covariance & Precision Estimation**
    - *Math:* empirical covariance, Ledoit–Wolf / OAS shrinkage, graphical lasso (sparse inverse covariance), Minimum Covariance Determinant

---
---

## Module 14 — Graphical Models & Structured Prediction

1. **Bayesian Networks (directed)**
   - *Math:* factorization, conditional independence, d-separation
2. **Markov Random Fields (undirected)**
   - *Math:* potentials, cliques, partition function, Hammersley–Clifford
3. **Exact & approximate inference**
   - *Math:* variable elimination, belief propagation (sum/max-product), junction tree, loopy BP
4. **Hidden Markov Models (HMM)**
   - *Math:* transition/emission/initial probabilities, Forward–Backward, Viterbi, Baum–Welch
5. **Conditional Random Fields (CRF)**
   - *Math:* feature functions, log-linear model, partition function, structured likelihood
6. **Kalman Filters & Linear State-Space Models**
   - *Math:* predict/update recursions, Gaussian state estimation, (extended/unscented variants)
7. **Latent Dirichlet Allocation (topic models)**
   - *Math:* Dirichlet & categorical distributions, generative process, Gibbs sampling / variational inference
8. **Structured SVM**
   - *Math:* structured hinge loss, max-margin over structured outputs
9. **Particle Filters (Sequential Monte Carlo)**
   - *Math:* importance sampling over time, resampling, non-linear/non-Gaussian state estimation

---
---

## Module 15 — Sequential Decision & Interactive Learning

1. **Multi-Armed Bandits**
   - *Math:* regret, exploration–exploitation, ε-greedy, UCB, Thompson sampling
2. **Contextual Bandits**
   - *Math:* per-context reward models, LinUCB
3. **Markov Decision Processes & Dynamic Programming**
   - *Math:* states/actions/rewards, Bellman equations, value iteration, policy iteration
4. **Model-Free Reinforcement Learning**
   - *Math:* Monte Carlo, temporal-difference, Q-learning, SARSA
5. **Policy Gradient Methods**
   - *Math:* policy-gradient theorem, REINFORCE, actor-critic
6. **Online Learning**
   - *Math:* regret bounds, online gradient descent, follow-the-regularized-leader (FTRL)
7. **Active Learning**
   - *Math:* uncertainty sampling, query-by-committee, expected model change

---
---

## Module 16 — Time-Series & Forecasting

1. **Time-series structure**
   - *Math:* stationarity, autocorrelation (ACF/PACF), differencing, decomposition (trend/seasonality)
2. **Classical models**
   - *Math:* AR, MA, ARMA, ARIMA, SARIMA, model identification
3. **Exponential smoothing**
   - *Math:* simple / Holt / Holt–Winters, state-space ETS
4. **Feature-based forecasting**
   - *Math:* lag/rolling/calendar features with gradient-boosted trees, leak-free windows
5. **Hierarchical forecasting & reconciliation**
   - *Math:* bottom-up, top-down, MinT reconciliation, coherence
6. **Volatility & multivariate models**
   - *Math:* ARCH / GARCH (conditional variance), Vector Autoregression (VAR), cointegration
7. **Forecast evaluation**
   - *Math:* walk-forward backtesting, WAPE, MASE, RMSSE, pinball loss (quantile forecasts)

---
---

## Module 17 — Specialized Learning Problems

1. **Anomaly / Outlier Detection**
   - *Math:* statistical thresholds, Isolation Forest, Local Outlier Factor, one-class SVM, elliptic envelope
2. **Recommender Systems (classical)**
   - *Math:* content-based & collaborative filtering, user/item similarity, matrix factorization, factorization machines, implicit feedback
3. **Learning to Rank**
   - *Math:* pointwise / pairwise (RankNet) / listwise (LambdaMART) objectives, NDCG optimization
4. **Association Rule Mining**
   - *Math:* support, confidence, lift, Apriori, FP-Growth, Eclat
5. **Survival Analysis**
   - *Math:* hazard & survival functions, Kaplan–Meier estimator, Cox proportional hazards, censoring
6. **Semi-Supervised Learning**
   - *Math:* self-training, co-training, label propagation, graph-based methods
7. **Metric Learning**
   - *Math:* Mahalanobis distance learning, LMNN, triplet/contrastive objectives
8. **Multi-Task & Transfer Learning (classical)**
   - *Math:* shared representations, regularization coupling, domain adaptation / covariate shift

---
---

## Module 18 — Interpretability of Models

1. **Feature importance**
   - *Math:* impurity-based, permutation importance
2. **Partial Dependence & ICE plots**
   - *Math:* marginal effect estimation, individual conditional expectation
3. **SHAP (Shapley values)**
   - *Math:* cooperative game theory, Shapley value axioms, additive attributions
4. **LIME**
   - *Math:* local surrogate models, weighted linear approximation
5. **Global surrogate & counterfactual explanations**
   - *Math:* fidelity, minimal-change counterfactuals

---

*Suggested order: Modules 1–2 first (foundations + optimization), then 3–8 (supervised), 9–10 (evaluation & features, applied throughout), 11–12 (unsupervised), 13–15 (probabilistic, graphical, sequential), 16–18 (time-series, specialized problems, interpretability). Modules 9, 10 and 18 are cross-cutting — apply them to every model you build.*