---
layout: archive
title: "Research"
permalink: /Research/
author_profile: true
---

{% include base_path %}

Research 
======

---------------

* **An Efficient Pruner for Large Language Model with Theoretical Guarantee** （with Canhong Wen and Wenliang Pan）         
Abstract: Large Language Models (LLMs) have showcased remarkable performance across a range of tasks but are hindered by their massive parameter sizes, which impose significant computational and storage demands. Pruning has emerged as an effective solution to reduce model size, but traditional methods often involve inefficient retraining or rely on heuristic-based one-shot approaches that lack theoretical guarantees. In this paper, we reformulate the pruning problem as an $\ell_0$-penalized optimization problem and propose a monotone accelerated Iterative Hard Thresholding (mAIHT) method. Our approach combines solid theoretical foundations with practical effectiveness, offering a detailed theoretical analysis that covers convergence, convergence rates, and risk upper bounds. Through extensive experiments, we demonstrate that mAIHT outperforms state-of-the-art pruning techniques by effectively pruning the LLaMA-7B model across various evaluation metrics.

---------------
  
* [**A Highly Scalable Parallel Algorithm for Trend Filtering on Graphs**](https://github.com/byn1002/Doge-ADMM)  (with Yinan Bu, Dongrun Wu)      
Abstract: Graph trend filtering is a powerful nonparametric method based on minimizing the $\ell_1$ norm of discrete graph differences for analyzing data with arbitrary graph structures, aiming to extract piecewise smooth graph signals. However, traditional ADMM algorithms face challenges in balancing the trade-off between convergence rate and the tractability of subproblems, often resulting in computational inefficiency. In this paper, We propose a novel Differential Operator Grouping-based ADMM algorithm (Doge-ADMM), which leverages differential operator grouping techniques to achieve scalable parallel computation with closed-form solutions for sub-problems while maintaining a fast convergence rate. Experiments on 2-D grid graphs demonstrate that Doge-ADMM achieves up to 30x acceleration over state-of-the-art methods in second-order trend filtering, making it highly suitable for large-scale problems.
 



