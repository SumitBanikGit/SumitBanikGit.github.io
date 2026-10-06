#!/usr/bin/env python3
"""
Builds index.html from the data below.

All site content lives in this file. To update the website:
  1. edit the lists below (add a paper, a talk, ...),
  2. run:  python3 build.py
  3. commit and push index.html (GitHub Pages redeploys automatically).

Inline HTML is allowed in titles (e.g. <sub>, <i>, &gamma;).
"""
import json
import re
from datetime import date
from pathlib import Path

ME = "S. Banik"

PROFILE = {
    "name": "Sumit Banik",
    "title": "Postdoctoral Researcher",
    "affiliation": "SLAC National Accelerator Laboratory &amp; Stanford University",
    "email": "banik@stanford.edu",
    "url": "https://sumitbanikgit.github.io/",   # change if you add a custom domain
    "orcid": "0000-0002-5869-5293",
    "inspire": "https://inspirehep.net/authors/1810309",
    "scholar": "https://scholar.google.com/citations?user=dNGju0YAAAAJ&hl=en",  # the Google Scholar profile
    "arxiv": "https://arxiv.org/search/?query=Banik%2C+Sumit&searchtype=author",  # all 26 preprints
    "github": "https://github.com/SumitBanikGit",
    "linkedin": "https://www.linkedin.com/in/waytosumitbanik",
    "portrait": "assets/portrait.jpg",          # set to None to show a monogram
    "goatcounter": "sumitbanik",                 # GoatCounter site code for private visitor statistics ("" to switch off)
}

# --------------------------------------------------------------------------
# Publications. kind: article | proceedings | thesis
# topic: fi (Feynman integrals & mathematical methods) | pheno (BSM & collider)
#        | soft (software)   -- a paper may carry several, space separated
# --------------------------------------------------------------------------
PUBS = [
    dict(kind="article", year=2026, topic="fi",
         title="Multiple Mellin-Barnes integrals with polygamma functions",
         authors="S. Banik, S. Friot",
         ref="Phys. Rev. D <b>114</b>, 056004 (2026)",
         arxiv="2512.19803", doi="10.1103/yfvl-dfk2", inspire="3095311"),
    dict(kind="article", year=2026, topic="fi soft",
         title="HyperPrecision: A Mathematica package for high-precision numerical evaluation of multivariate hypergeometric functions",
         authors="S. Banik, S. Bera",
         ref="Comput. Phys. Commun. <b>328</b>, 110328 (2026)",
         arxiv="2605.30216", doi="10.1016/j.cpc.2026.110328", inspire="3189851",
         code="https://github.com/HyperPrecision/HyperPrecision"),
    dict(kind="article", year=2026, topic="fi",
         title="Sunset integrals with up to three mass scales in chiral perturbation theory: a comparative study of the Mellin-Barnes representation technique",
         authors="B. Ananthanarayan, S. Banik, V. Bernard, S. Friot, S. Ghosh, U.-G. Meißner",
         ref="Eur. Phys. J. Spec. Top. <b>235</b>, 1833 (2026)",
         arxiv="2512.07727", doi="10.1140/epjs/s11734-026-02137-w", inspire="3090403",
         erratum="10.1140/epjs/s11734-026-02421-9"),
    dict(kind="article", year=2026, topic="pheno",
         title="Two-loop anomalous dimensions for baryon-number-violating operators in SMEFT",
         authors="S. Banik, A. Crivellin, L. Naterop, P. Stoffer",
         ref="JHEP <b>02</b> (2026) 017",
         arxiv="2510.08682", doi="10.1007/JHEP02(2026)017", inspire="3066755"),
    dict(kind="article", year=2025, topic="fi pheno",
         title="Some topics concerning the standard model, Feynman integrals and renormalization group methods: a review of some recent investigations and results",
         authors="B. Ananthanarayan, S. Banik, S. Bera, A. B. Das, S. Datta, S. Friot, S. Ghosh, M. S. A. Alam Khan, T. Pathak, R. Sarkar, D. Wyler",
         ref="Eur. Phys. J. Spec. Top. <b>234</b>, 8005",
         doi="10.1140/epjs/s11734-025-02019-7", inspire="3081108"),
    dict(kind="article", year=2025, topic="pheno",
         title="Correlating <i>A</i> → <i>γγ</i> with electric dipole moments in the two Higgs doublet model in light of the diphoton excesses at 95 GeV and 152 GeV",
         authors="S. Banik, G. Coloretti, A. Crivellin, H. E. Haber",
         ref="Phys. Rev. D <b>111</b>, 075021 (2025)",
         arxiv="2412.00523", doi="10.1103/PhysRevD.111.075021", inspire="2854614"),
    dict(kind="article", year=2025, topic="pheno",
         title="Growing evidence for a Higgs triplet",
         authors="A. Crivellin, S. Ashanujjaman, S. Banik, G. Coloretti, S. P. Maharathy, B. Mellado",
         ref="Chin. Phys. C <b>49</b>, 053107 (2025)",
         arxiv="2404.14492", doi="10.1088/1674-1137/adbb5a", inspire="2779998"),
    dict(kind="article", year=2025, topic="pheno",
         title="Anatomy of the real Higgs triplet model",
         authors="S. Ashanujjaman, S. Banik, G. Coloretti, A. Crivellin, S. P. Maharathy, B. Mellado",
         ref="JHEP <b>04</b> (2025) 003",
         arxiv="2411.18618", doi="10.1007/JHEP04(2025)003", inspire="2853386"),
    dict(kind="article", year=2025, topic="pheno",
         title="Explaining the <i>γγ</i> + <i>X</i> excesses at ≈ 151.5 GeV via the Drell-Yan production of a Higgs triplet",
         authors="S. Ashanujjaman, S. Banik, G. Coloretti, A. Crivellin, S. P. Maharathy, B. Mellado",
         ref="Phys. Lett. B <b>862</b>, 139298 (2025)",
         arxiv="2402.00101", doi="10.1016/j.physletb.2025.139298", inspire="2753881"),
    dict(kind="article", year=2025, topic="pheno",
         title='Uncovering new Higgses in the LHC analyses of differential <i>t</i><span class="ov"><i>t</i></span> cross sections',
         authors="S. Banik, G. Coloretti, A. Crivellin, B. Mellado",
         ref="JHEP <b>01</b> (2025) 155",
         arxiv="2308.07953", doi="10.1007/JHEP01(2025)155", inspire="2688610"),
    dict(kind="article", year=2024, topic="pheno",
         title="Explanation of the excesses in associated di-photon production at 152 GeV in 2HDM",
         authors="S. Banik, A. Crivellin",
         ref="JHEP <b>10</b> (2024) 203",
         arxiv="2407.06267", doi="10.1007/JHEP10(2024)203", inspire="2806093"),
    dict(kind="article", year=2024, topic="fi soft",
         title="Multiple Mellin-Barnes integrals and triangulations of point configurations",
         authors="S. Banik, S. Friot",
         ref="Phys. Rev. D <b>110</b>, 036002 (2024)",
         arxiv="2309.00409", doi="10.1103/PhysRevD.110.036002", inspire="2692835",
         code="https://github.com/SumitBanikGit/MBConicHulls"),
    dict(kind="article", year=2023, topic="pheno",
         title="Renormalization group evolution with scalar leptoquarks",
         authors="S. Banik, A. Crivellin",
         ref="JHEP <b>11</b> (2023) 121",
         arxiv="2307.06800", doi="10.1007/JHEP11(2023)121", inspire="2676637"),
    dict(kind="article", year=2023, topic="pheno",
         title="<i>SU</i>(2)<sub><i>L</i></sub> triplet scalar as the origin of the 95 GeV excess?",
         authors="S. Ashanujjaman, S. Banik, G. Coloretti, A. Crivellin, B. Mellado, A. Mulaudzi",
         ref="Phys. Rev. D <b>108</b>, L091704 (2023)",
         arxiv="2306.15722", doi="10.1103/PhysRevD.108.L091704", inspire="2672557"),
    dict(kind="article", year=2023, topic="pheno",
         title="Asymmetric di-Higgs signals of the next-to-minimal 2HDM with a <i>U</i>(1) symmetry",
         authors="S. Banik, A. Crivellin, S. Iguro, T. Kitahara",
         ref="Phys. Rev. D <b>108</b>, 075011 (2023)",
         arxiv="2303.11351", doi="10.1103/PhysRevD.108.075011", inspire="2644520"),
    dict(kind="article", year=2023, topic="fi soft",
         title="Multiple Mellin-Barnes integrals with straight contours",
         authors="S. Banik, S. Friot",
         ref="Phys. Rev. D <b>107</b>, 016007 (2023)",
         arxiv="2212.11839", doi="10.1103/PhysRevD.107.016007", inspire="2617451",
         code="https://github.com/SumitBanikGit/MBConicHulls"),
    dict(kind="article", year=2023, topic="fi soft",
         title="FeynGKZ: a Mathematica package for solving Feynman integrals using GKZ hypergeometric systems",
         authors="B. Ananthanarayan, S. Banik, S. Bera, S. Datta",
         ref="Comput. Phys. Commun. <b>287</b>, 108699 (2023)",
         arxiv="2211.01285", doi="10.1016/j.cpc.2023.108699", inspire="2175571",
         code="https://github.com/anant-group/FeynGKZ"),
    dict(kind="article", year=2023, topic="fi",
         title="Method of brackets: revisiting a technique for calculating Feynman integrals and certain definite integrals",
         authors="B. Ananthanarayan, S. Banik, S. Friot, T. Pathak",
         ref="Phys. Rev. D <b>108</b>, 085001 (2023)",
         arxiv="2112.09679", doi="10.1103/PhysRevD.108.085001", inspire="1992936"),
    dict(kind="article", year=2021, topic="fi soft",
         title="Multiple series representations of <i>N</i>-fold Mellin-Barnes integrals",
         authors="B. Ananthanarayan, S. Banik, S. Friot, S. Ghosh",
         ref="Phys. Rev. Lett. <b>127</b>, 151601 (2021)",
         arxiv="2012.15108", doi="10.1103/PhysRevLett.127.151601", inspire="1838822",
         code="https://github.com/SumitBanikGit/MBConicHulls"),
    dict(kind="article", year=2021, topic="fi",
         title="Massive one-loop conformal Feynman integrals and quadratic transformations of multiple hypergeometric series",
         authors="B. Ananthanarayan, S. Banik, S. Friot, S. Ghosh",
         ref="Phys. Rev. D <b>103</b>, 096008 (2021)",
         arxiv="2012.15646", doi="10.1103/PhysRevD.103.096008", inspire="1838883"),
    dict(kind="article", year=2020, topic="fi",
         title="Double box and hexagon conformal Feynman integrals",
         authors="B. Ananthanarayan, S. Banik, S. Friot, S. Ghosh",
         ref="Phys. Rev. D <b>102</b>, 091901 (2020)",
         arxiv="2007.08360", doi="10.1103/PhysRevD.102.091901", inspire="1807471"),
    dict(kind="article", year=2019, topic="fi",
         title="Quadratic and quartic integrals using the method of brackets",
         authors="B. Ananthanarayan, S. Banik, S. Datta, T. Pathak",
         ref="Scientia <b>29</b>, 45 (2019)",
         arxiv="1909.00962", inspire="1752370"),

    # ---- conference proceedings
    dict(kind="proceedings", year=2026, topic="fi",
         title="Automated computation of multiple Mellin-Barnes integrals having polygamma functions in their integrand",
         authors="S. Banik, S. Friot",
         ref="Acta Phys. Pol. B Proc. Suppl. <b>19</b>, 2-A8 (2026)", venue="MTTD 2025",
         doi="10.5506/APhysPolBSupp.19.2-A8", inspire="3153391", tour="2512.19803"),
    dict(kind="proceedings", year=2026, topic="pheno",
         title="Indications for new Higgs bosons",
         authors="A. Crivellin, S. Ashanujjaman, S. Banik, S. P. Maharathy, G. Coloretti",
         ref="PoS CORFU2025, 064", venue="Corfu Summer Institute 2025",
         arxiv="2605.04233", doi="10.22323/1.509.0064", inspire="3152377"),
    dict(kind="proceedings", year=2025, topic="pheno",
         title='New Higgses at the electroweak scale and differential <i>t</i><span class="ov"><i>t</i></span> distributions',
         authors="S. Banik, G. Coloretti, A. Crivellin, S. Bhattacharya, B. Mellado",
         ref="PoS DIS2024, 125", venue="DIS 2024",
         doi="10.22323/1.469.0125", inspire="2865718", tour="2308.07953"),
    dict(kind="proceedings", year=2024, topic="fi",
         title="Analytic evaluation of multiple Mellin-Barnes integrals",
         authors="S. Banik, S. Friot",
         ref="PoS LL2024, 039", venue="Loops and Legs 2024",
         arxiv="2407.20120", doi="10.22323/1.467.0039", inspire="2811746"),
    dict(kind="proceedings", year=2024, topic="fi soft",
         title="Automated evaluation of Feynman integrals using GKZ hypergeometric systems",
         authors="B. Ananthanarayan, S. Banik, S. Bera, S. Datta",
         ref="Springer Proc. Phys. <b>304</b>, 124 (2024)", venue="DAE-BRNS HEP Symposium",
         doi="10.1007/978-981-97-0289-3_26", inspire="2809580", tour="2211.01285"),
    dict(kind="proceedings", year=2024, topic="fi",
         title="Geometrical methods for the analytic evaluation of multiple Mellin-Barnes integrals",
         authors="S. Banik, S. Friot",
         ref="Acta Phys. Pol. B Proc. Suppl. <b>17</b>, 2-A12 (2024)", venue="MTTD 2023",
         arxiv="2402.04174", doi="10.5506/APhysPolBSupp.17.2-A12", inspire="2755993"),
    dict(kind="proceedings", year=2023, topic="pheno",
         title="Differential <i>eμbb</i> cross-sections and new Higgses at the electroweak scale",
         authors="S. Banik, G. Coloretti, A. Crivellin, B. Mellado",
         ref="TOP 2023 proceedings", venue="16th Int. Workshop on Top Quark Physics",
         arxiv="2312.01458", inspire="2729959", tour="2308.07953"),

    # ---- thesis
    dict(kind="thesis", year=2022, topic="fi",
         title="On hypergeometric solutions of Feynman integrals using Mellin-Barnes integrals with applications",
         authors="S. Banik",
         ref="PhD thesis, Indian Institute of Science, Bengaluru (2022)",
         inspire="2614373", tour="inspire:2614373"),
]

# Recent news shown on the front page (newest first; keep ~5).
# Each item links to where the site says more about it.
NEWS = [
    ("2026", "Invited virtual talk at <b>CERN</b>, FCC Precision Calculations Working Group.", "talk:FCC Precision Calculations"),
    ("2026", "Multiple Mellin-Barnes integrals with polygamma functions, the paper of <b>MBConicHulls</b> 1.3, "
             "published in <i>Physical Review D</i>.", "publications.html#arxiv-2512.19803"),
    ("2026", "<b>HyperPrecision</b> published in <i>Computer Physics Communications</i>.", "software.html#hyperprecision"),
    ("2026", "Two-loop anomalous dimensions of baryon-number-violating operators in SMEFT published in <i>JHEP</i>.",
     "publications.html#arxiv-2510.08682"),
    ("2026", "Joined the <b>Fundamental Physics Directorate</b> at SLAC, Stanford as a postdoctoral researcher.", "cv.html#positions"),
    ("2025", "Awarded the <b>SNSF Postdoc.Mobility Fellowship</b>.", "funding.html#postdoc-mobility-fellowship"),
]

# The "Path" timeline in About (oldest first). logos: files in assets/logos/.
JOURNEY = [
    ("2014", "Kolkata", "BSc in Physics", "University of Calcutta", [("calcutta", "University of Calcutta")]),
    ("2017", "Bengaluru", "MS and PhD", "Indian Institute of Science", [("iisc", "Indian Institute of Science")]),
    ("2023", "Zürich", "Postdoctoral Researcher", "University of Zürich &amp; Paul Scherrer Institut",
     [("uzh", "University of Zürich"), ("psi", "Paul Scherrer Institut")]),
    ("2026", "San Francisco", "Postdoctoral Researcher", "SLAC &amp; Stanford University",
     [("slac", "SLAC"), ("stanford", "Stanford University")]),
]

# Map positions (latitude, longitude) and label placement (dx, dy, text-anchor) for each stop.
JOURNEY_GEO = [
    (22.5726, 88.3639, (14, -8, "start")),      # Kolkata
    (12.9716, 77.5946, (-14, 20, "end")),       # Bengaluru
    (47.3769, 8.5417, (0, -22, "middle")),      # Zürich
    (37.7749, -122.4194, (0, 30, "middle")),    # San Francisco (label below: the name is long)
]

# where the talks were given (latitude, longitude), for the map on the Talks page
CITY_GEO = {
    "Geneva": (46.234, 6.047), "Menlo Park": (37.42, -122.205), "Berlin": (52.52, 13.405),
    "Warsaw": (52.2297, 21.0122), "Bonn": (50.7374, 7.0982), "Kathmandu": (27.7172, 85.324),
    "Karlsruhe": (49.0069, 8.4037), "Uppsala": (59.8586, 17.6389), "Charlottesville": (38.0293, -78.4767),
    "Cincinnati": (39.1031, -84.512), "Pittsburgh": (40.4406, -79.9959), "Paris": (48.8566, 2.3522),
    "Zürich": (47.3769, 8.5417), "Lisbon": (38.7223, -9.1393), "Villigen": (47.5361, 8.2272),
    "Wittenberg": (51.8661, 12.6466), "Chicago": (41.8781, -87.6298), "Traverse City": (44.7631, -85.6206),
    "Sursee": (47.1714, 8.111), "Bhubaneswar": (20.2961, 85.8245), "Bengaluru": (13.0219, 77.5671),
    "Mainz": (49.9929, 8.2473), "Prague": (50.0755, 14.4378), "Hyderabad": (17.385, 78.4867),
}

# Research areas scrolling in the band under the navigation.
TICKER = ["Feynman integrals", "Hypergeometric functions", "Special functions", "Mellin-Barnes integrals", "Effective field theories",
          "Renormalization group", "Higgs physics", "Two-Higgs-doublet models", "Higgs triplets",
          "Collider phenomenology", "Beyond the Standard Model",
          "Computer algebra"]

# Research domains on the Research page (one card each).
DOMAINS = [
    ("Mathematical physics",
     "Multivariable hypergeometric functions and their analytic continuation, GKZ systems, convex geometry of conic hulls and triangulations, and the method of brackets.",
     "Hypergeometric functions · GKZ systems · Convex geometry"),
    ("Feynman integrals",
     "Analytic and numerical evaluation of multi-loop and multi-scale Feynman integrals through <i>N</i>-fold Mellin-Barnes representations, including conformal and sunset integrals.",
     "Mellin-Barnes · Conformal integrals · Multi-loop"),
    ("Multi-Higgs physics",
     "Extended scalar sectors such as the 2HDM, the N2HDM and Higgs triplets confronted with LHC data, the di-photon excesses near 95 and 152 GeV, and correlations with EDMs.",
     "2HDM · Higgs triplets · LHC excesses"),
    ("Computational tools",
     "Open-source <i>Mathematica</i> packages for precision calculations: <a href=\"software.html#mbconichulls\">MBConicHulls</a>, "
     "<a href=\"software.html#feyngkz\">FeynGKZ</a> and <a href=\"software.html#hyperprecision\">HyperPrecision</a>.",
     "Mathematica · Computer algebra · High precision"),
    ("Effective field theory",
     "The Standard Model effective field theory, two-loop anomalous dimensions of baryon-number-violating operators, and renormalization group evolution.",
     "SMEFT · RG evolution · Proton decay"),
    ("Exotic particles",
     "Leptoquarks and new scalars beyond the Standard Model, their signatures at the LHC, and their imprint on low-energy observables.",
     "Leptoquarks · New scalars · LHC signatures"),
]

# The research domain of each paper (by arXiv number, or INSPIRE number where there is none), so that each
# domain card on the Research page opens its own papers on the Publications page. Keys, in the order of DOMAINS:
DOMAIN_KEYS = ["math", "fi", "higgs", "tools", "eft", "exotic"]
PAPER_DOMAINS = {
    "2512.19803": "fi math tools", "2605.30216": "tools math", "2512.07727": "fi math", "2510.08682": "eft exotic",
    "3081108": "fi eft", "2412.00523": "higgs", "2404.14492": "higgs", "2411.18618": "higgs", "2402.00101": "higgs",
    "2308.07953": "higgs", "2407.06267": "higgs", "2309.00409": "fi math tools", "2307.06800": "exotic eft",
    "2306.15722": "higgs", "2303.11351": "higgs", "2212.11839": "fi math tools", "2211.01285": "tools fi math",
    "2112.09679": "math fi", "2012.15108": "fi math tools", "2012.15646": "fi math", "2007.08360": "fi",
    "1909.00962": "math", "3153391": "fi math tools", "2605.04233": "higgs", "2865718": "higgs",
    "2407.20120": "fi math", "2809580": "fi math tools", "2402.04174": "fi math", "2312.01458": "higgs",
    "2614373": "fi math",
}


# Papers highlighted under "Selected work" (arXiv id, one-line pitch).
SELECTED = [
    ("pheno", "Two-loop anomalous dimensions for baryon-number-violating operators in SMEFT",
     "JHEP (2026)", "2510.08682",
     "The two-loop running of baryon-number-violating operators in SMEFT, a key input for precise predictions of proton decay."),
    ("fi", "Multiple series representations of <i>N</i>-fold Mellin-Barnes integrals",
     "Phys. Rev. Lett. (2021)", "2012.15108",
     "A general, geometric way to turn <i>N</i>-fold Mellin-Barnes integrals into convergent multivariable series using conic hulls."),
    ("pheno", "<i>SU</i>(2)<sub><i>L</i></sub> triplet scalar as the origin of the 95 GeV excess?",
     "Phys. Rev. D Letter (2023)", "2306.15722",
     "A Higgs-triplet explanation of the di-photon excess near 95 GeV, and its predictions for further LHC searches."),
]

# Most recent talks shown as cards; the rest sit behind a "show earlier talks" toggle.
TALK_CARDS = 6

# --------------------------------------------------------------------------
TALKS = [
    (2026, "FCC Precision Calculations WG Meeting, CERN (online)", "Geneva",
     "Algorithms for analytic and numerical evaluation of multiple Mellin-Barnes integrals",
     "Invited by J. Gluza and M. Zaro", True),
    (2026, "EPP Theory Seminar, SLAC &amp; Stanford University", "Menlo Park",
     "Geometrical techniques to compute Feynman integrals", "Invited by the SLAC Theory Group", True),   # as in the CV
    (2025, "New Ways to Higher Points, Humboldt-Universität zu Berlin", "Berlin",
     "Analytic evaluation of Feynman integrals using the Mellin-Barnes representation",
     "Invited by B. Eden", True),
    (2025, "Scalars 2025, University of Warsaw", "Warsaw",
     "Indications for new Higgs bosons in associated di-photon searches", "", False),
    (2025, "Amplitudes Seminar Series (Bonn)", "Bonn",
     "Algorithms for analytic evaluation of Feynman integrals using the MB representation",
     "Invited by F. Loebbert and C. Duhr", True),
    (2024, "BCVSPIN, Tribhuvan &amp; Kathmandu University", "Kathmandu",
     "Accumulating evidence for new Higgs bosons at the LHC", "", False),
    (2024, "Particle Physics Seminar, KIT", "Karlsruhe",
     "Accumulating evidence for new Higgs bosons from associated di-photon searches",
     "Hosted by U. Nierste", True),
    (2024, "HIGGS 2024, Uppsala University", "Uppsala",
     "Indications for new Higgs bosons in associated di-photon searches", "", False),
    (2024, "HEP Seminar, University of Virginia", "Charlottesville",
     "Accumulating evidence for new Higgs bosons from associated di-photon searches",
     "Hosted by J. Heeck", True),
    (2024, "HEP Seminar, University of Cincinnati", "Cincinnati",
     "Accumulating evidence for new Higgs bosons from associated di-photon searches",
     "Hosted by J. Brod", True),
    (2024, "Pitt PACC Seminar, University of Pittsburgh", "Pittsburgh",
     "Accumulating evidence for new Higgs bosons from associated di-photon searches",
     "Hosted by T. Han and A. Bhoonah", True),
    (2024, "3rd ECFA Workshop on e<sup>+</sup>e<sup>−</sup> Higgs, Top &amp; Electroweak Factories", "Paris",
     "Hints for new Higgs bosons in associated di-photon production", "", False),
    (2024, "SPS Annual Meeting (CHIPP)", "Zürich",
     "Hints for new Higgs bosons at the LHC", "", False),
    (2024, "Workshop on Multi-Higgs Models", "Lisbon",
     "Accumulating evidence for new Higgs bosons at the LHC", "", False),
    (2024, "Theoretical Particle Physics Journal Club, UZH", "Zürich",
     "Recent progress in evaluating scalar Feynman integrals",
     "Invited by O. Lara Crosas, C. Savoini and M. Pesut", True),
    (2024, "LTP(izza)hD Seminar, Paul Scherrer Institut", "Villigen",
     "Geometrical approaches to evaluate Feynman integrals",
     "Invited by S. Kollatzsch and T. D. Hume", True),
    (2024, "Loops and Legs in Quantum Field Theory 2024", "Wittenberg",
     "Analytic evaluation of multiple Mellin-Barnes integrals", "", False),
    (2023, "HEP Group Lunch Seminar, University of Chicago &amp; Argonne", "Chicago",
     "Hints for new Higgses at the electroweak scale",
     "Hosted by C. Wagner and D. Miller", True),
    (2023, "16th Int. Workshop on Top Quark Physics (TOP 2023)", "Traverse City",
     'Uncovering new Higgses in the LHC analyses of differential <i>t</i><span class="ov"><i>t</i></span> cross sections', "", False),
    (2023, "Scalars 2023, University of Warsaw", "Warsaw",
     "Asymmetric di-Higgs signals", "", False),
    (2023, "Scalars 2023, University of Warsaw", "Warsaw",
     "Triplet explanation of the 95 GeV excess", "", False),
    (2023, "CHIPP/CHART Workshop on Sustainability in Particle Physics", "Sursee",
     "Asymmetric di-Higgs signals of the N2HDM", "", False),
    (2023, "SPS HEP Seminar, NISER", "Bhubaneswar",
     "Evaluating Feynman integrals using <i>N</i>-fold Mellin-Barnes integrals",
     "Invited by N. Rana", True),
    (2022, "CHEP In-House Symposium, Indian Institute of Science", "Bengaluru",
     "Triangulations, Mellin-Barnes and Feynman integrals", "", False),
    (2022, "Elliptic Integrals in Fundamental Physics, MITP", "Mainz",
     "Hypergeometric solutions of Feynman integrals using Mellin-Barnes integrals",
     "Invited by J. Broedel, E. Chaubey, C. Duhr and S. Weinzierl", True),
    (2022, "Tropical and Convex Geometry and Feynman Integrals", "Zürich",
     "Mellin-Barnes, conic hulls and triangulations",
     "Invited by M. Borinsky and E. Panzer", True),
    (2022, "Amplitudes Summer School", "Prague",
     "Multi-fold Mellin-Barnes with applications to Feynman integrals", "", False),
    (2021, "Joint Bonn-Berlin Seminar (online)", "Berlin",
     "<i>N</i>-fold Mellin-Barnes integrals and applications to conformal Feynman integrals and multivariable hypergeometric functions",
     "Invited by C. Duhr and F. Loebbert", True),
    (2021, "HEP Remote Video Seminar Series (online)", "Hyderabad",
     "Feynman integrals, hypergeometric functions and Mellin-Barnes representation",
     "Invited by A. Tripathi", True),
    (2021, "CHEP In-House Symposium, Indian Institute of Science", "Bengaluru",
     "<i>N</i>-fold Mellin-Barnes representation and Feynman integrals", "", False),
    (2020, "CHEP In-House Symposium, Indian Institute of Science", "Bengaluru",
     "Decoding the divergences of the method of brackets", "", False),
]

FUNDING = [
    ("2026", "Walter Benjamin Fellowship", "Deutsche Forschungsgemeinschaft (DFG)", "Germany",
     "€225,334 (≈ $262,300)", "2 years", "Declined"),
    ("2025", "Postdoc.Mobility Fellowship", "Swiss National Science Foundation (SNSF)", "Switzerland",
     "CHF 136,000 (≈ $173,100)", "2 years", ""),
    ("2025", "Humboldt Postdoctoral Research Fellowship", "Alexander von Humboldt Foundation", "Germany",
     "€72,000 (≈ $83,800)", "2 years", "Declined"),
    ("2024", "UZH Postdoc Grant", "University of Zürich", "Switzerland",
     "CHF 58,560 (≈ $74,500)", "6 months", ""),
    ("2021", "Senior Research Fellowship", "Ministry of Human Resource Development", "India",
     "₹1,260,000 (≈ $13,100)", "3 years", ""),
    ("2019", "Junior Research Fellowship", "Ministry of Human Resource Development", "India",
     "₹744,000 (≈ $7,700)", "2 years", ""),
    ("2017", "Master’s Fellowship", "Ministry of Human Resource Development", "India",
     "₹384,000 (≈ $4,000)", "2 years", ""),
]

TEACHING = [
    ("2025", "Proseminar Theoretische Physik", "Teaching Assistant", "Universität Zürich",
     "Guided students in preparing seminar talks on a range of physics topics and assessed their weekly presentations."),
    ("2024", "Flavour Physics", "Teaching Assistant", "Universität Zürich",
     "Taught weekly one-hour tutorials and assisted with the final oral examination."),
    ("2023", "Quantum Field Theory I", "Teaching Assistant", "ETH Zürich",
     "Taught weekly two-hour tutorials and graded the final written examination."),
    ("2020", "Introductory Physics II", "Teaching Assistant", "Indian Institute of Science",
     "Supervised weekly three-hour laboratory sessions, taught tutorials, and conducted and graded the final examinations."),
]

SUPERVISION = [
    ("2025", "Corentin Eggenspieler", "Master’s student", "ENS Paris-Saclay",
     "Novel computation techniques for perturbative quantum field theory"),
    ("2024", "Banurega Shanmuganathan", "Bachelor’s student", "Universität Zürich",
     "Compendium of two-body decays"),
    ("2022", "Mathieu Ferey", "Master’s student", "Université Paris-Saclay",
     "Computation of Feynman diagrams and their transformation into Mellin-Barnes integrals for quantum field theory"),
]

REFEREE = [
    ("Journal of High Energy Physics", "Springer", "https://jhep.sissa.it/"),
    ("Physics Letters B", "Elsevier", "https://www.sciencedirect.com/journal/physics-letters-b"),
    ("Modern Physics Letters A", "World Scientific", "https://www.worldscientific.com/worldscinet/mpla"),
    ("SIGMA (Symmetry, Integrability and Geometry: Methods and Applications)", "Open Access", "https://www.emis.de/journals/SIGMA/"),
    ("Next Research", "Elsevier", "https://www.sciencedirect.com/journal/next-research"),
    ("Mathematics", "MDPI", "https://www.mdpi.com/journal/mathematics"),
]

SOFTWARE = [
    ("MBConicHulls",
     "Analytic evaluation of <i>N</i>-fold Mellin-Barnes integrals as (multivariable) series, using conic hulls and triangulations of point configurations.",
     "https://github.com/SumitBanikGit/MBConicHulls", "2012.15108"),
    ("FeynGKZ",
     "Solving Feynman integrals via Gel’fand-Kapranov-Zelevinsky hypergeometric systems, producing series solutions valid in different kinematic regions.",
     "https://github.com/anant-group/FeynGKZ", "2211.01285"),
    ("HyperPrecision",
     "High-precision numerical evaluation of multivariate hypergeometric functions, including outside their region of convergence.",
     "https://github.com/HyperPrecision/HyperPrecision", "2605.30216"),
]


# The Software page: each package with its versions, as its README and its releases on GitHub give them
# (a version that came out with a paper is dated by the paper on arXiv), what it needs, and how to get it.
PACKAGES = [
    dict(name="MBConicHulls", slug="mbconichulls", repo="https://github.com/SumitBanikGit/MBConicHulls",
         tagline="Mellin-Barnes integrals as hypergeometric series", what=SOFTWARE[0][1], paper="2012.15108",
         releases=[("v1.0", "Dec 2020", "Two-fold and higher Mellin-Barnes integrals with non-straight contours", "2012.15108", "conic hulls"),
                   ("v1.1", "Dec 2022", "Straight contours, and one-fold Mellin-Barnes integrals", "2212.11839", "straight contours"),
                   ("v1.2", "Sep 2023", "Triangulations, much faster than conic hulls for higher-fold integrals", "2309.00409", "triangulations"),
                   ("v1.3", "Dec 2025", "Polygamma functions, with both conic hulls and triangulations", "2512.19803", "polygamma functions")],
         needs=[("MultivariateResidues.m", "https://arxiv.org/abs/1701.01040", "included in the repository"),
                ("TOPCOM", "https://www.wm.uni-bayreuth.de/de/team/rambau_joerg/TOPCOM/", "")],
         extras=("The example notebooks also use", [("FIESTA5", "https://gitlab.com/feynmanintegrals/fiesta"),
                 ("MB.m", "https://mbtools.hepforge.org/"), ("MBresolve.m", "https://mbtools.hepforge.org/"),
                 ("EvaluateMultiSums", "https://www3.risc.jku.at/research/combinat/software/EvaluateMultiSums/index.php")]),
         files=["MBConicHulls.wl", "Examples.nb", "Pentagon.nb", "Examples_PolyGamma.nb"], load=""),
    dict(name="FeynGKZ", slug="feyngkz", repo="https://github.com/anant-group/FeynGKZ",
         tagline="Feynman integrals from GKZ hypergeometric systems", what=SOFTWARE[1][1], paper="2211.01285",
         releases=[("v1.0", "Nov 2022", "The first release, with the paper", "2211.01285", "first release")],
         needs=[("AMBRE 2.1.1", "https://jgluza.us.edu.pl/ambre/", ""), ("Olsson.wl", "https://arxiv.org/abs/2201.01189", "ancillary file of the paper"),
                ("polymake 4.6", "https://polymake.org/doku.php", ""), ("TOPCOM 0.17.8", "https://www.wm.uni-bayreuth.de/de/team/rambau_joerg/TOPCOM/", ""),
                ("Macaulay2 1.20", "http://www2.macaulay2.com/Macaulay2/", "")],
         extras=None, files=["FeynGKZ.wl", "Examples.nb"], load=""),
    dict(name="HyperPrecision", slug="hyperprecision", repo="https://github.com/HyperPrecision/HyperPrecision",
         tagline="Hypergeometric functions to high precision", what=SOFTWARE[2][1], paper="2605.30216",
         releases=[("v1.0", "May 2026", "The first release, with the paper", "2605.30216", "first release"),
                   ("v1.2", "Jul 2026", "Adds DESolver_patch.m for the interface with DESolver, and updated examples",
                    "https://github.com/HyperPrecision/HyperPrecision/releases/tag/HyperPrecisionv1.2", "the DESolver interface")],
         needs=[("FiniteFlow", "https://github.com/peraro/finiteflow", ""),
                ("DESolver from AMFlow", "https://gitlab.com/multiloop-pku/amflow", "included, with DESolver_patch.m")],
         extras=None, files=["HyperPrecision.wl", "DESolver.m", "DESolver_patch.m", "Examples.nb"], load="<< HyperPrecision`"),
]
LIBRARY = dict(name="SLQ-RG", slug="slq-rg", repo="https://github.com/SumitBanikGit/SLQ-RG",
               tagline="Renormalization group equations with scalar leptoquarks", paper="2307.06800", when="Jul 2023",
               what="The one- and two-loop renormalization group equations of the Standard Model extended with five scalar "
                    "leptoquarks, and the one-loop threshold corrections for matching onto the Standard Model.",
               tools=[("PyR@TE", "https://github.com/LSartore/pyrate", ""), ("RGBeta", "https://github.com/aethomsen/RGBeta", "as a cross-check"),
                      ("Matchete", "https://gitlab.com/matchete/matchete", "for the threshold corrections")],
               files=["SLQ_RGE_PyR@TE.model", "SLQ_RGE_PyR@TE_Results.m", "SLQ_RGE_RGBeta.nb", "SLQ_Threshold_Matchete.nb"])


# Small monochrome line icons for the contact row (24x24, drawn in currentColor).
def _svg(body):
    return ('<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
            'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>')

ICONS = {
    "i_mail": _svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
    "i_orcid": _svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 10v6"/><circle cx="8.5" cy="7.6" r=".4" fill="currentColor"/>'
                    '<path d="M11.5 16V8h2a4 4 0 0 1 0 8h-2z"/>'),
    # INSPIRE-HEP's own mark: a lower-case i cut out of a rounded square
    "i_inspire": _svg('<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7'
                      'A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5ZM12 6.6a1.45 1.45 0 1 0 0 2.9a1.45 1.45 0 1 0 0-2.9ZM10.8 10.9v6.6h2.4v-6.6Z"/>'),
    "i_scholar": _svg('<path d="m2.5 9.5 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 11.6v4.2c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.2"/><path d="M21.5 9.5v5"/>'),
    "i_arxiv": _svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 16.5h5"/>'),
    "i_github": _svg('<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 '
                     '4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'),
    "i_linkedin": _svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.5c0-1.7 1.2-3 2.7-3s2.3 1 2.3 3V17"/>'),
}

# Positions for the CV section. logos: files in assets/logos/ (one or two).
EMPLOYMENT = [
    dict(when="Since Jan 2026", where="California, USA", logos=[("stanford", "Stanford University"), ("slac", "SLAC")],
         title="Postdoctoral Researcher",
         org='<a href="https://theory.slac.stanford.edu/">SLAC National Accelerator Laboratory</a> &amp; <a href="https://www.stanford.edu/">Stanford&nbsp;University</a>',
         meta='Fundamental Physics Directorate'),
    dict(when="Mar 2023 to Dec 2025", where="Zürich, Switzerland", logos=[("uzh", "University of Zürich"), ("psi", "Paul Scherrer Institut")],
         title="Postdoctoral Researcher",
         org='<a href="https://www.physik.uzh.ch/">University of Zürich</a> &amp; <a href="https://www.psi.ch/">Paul Scherrer Institut</a>',
         meta="Research and teaching in theoretical particle physics"),
]

EDUCATION = [
    dict(when="Aug 2019 to Feb 2023", where="Bengaluru, India", logos=[("iisc", "Indian Institute of Science")],
         title="PhD in High Energy Physics",
         org='<a href="https://chep.iisc.ac.in/">Centre for High Energy Physics</a>, Indian Institute of Science',
         note='Thesis: <a href="https://inspirehep.net/literature/2614373"><i>On hypergeometric solutions of Feynman integrals using Mellin-Barnes integrals with applications</i></a>',
         facts=[("Supervisor", "Prof.&nbsp;B.&nbsp;Ananthanarayan"), ("Defended", "December 2022"), ("Awarded", "March 2023")]),
    dict(when="Aug 2017 to Jul 2019", where="Bengaluru, India", logos=[("iisc", "Indian Institute of Science")],
         title="MS in Physics",
         org="Department of Physical Sciences, Indian Institute of Science",
         facts=[("Supervisor", "Prof.&nbsp;B.&nbsp;Ananthanarayan"), ("Awarded", "March 2023, with the PhD")]),
    dict(when="Aug 2014 to Jul 2017", where="Kolkata, India", logos=[("calcutta", "University of Calcutta")],
         title="BSc in Physics",
         org="University of Calcutta",
         facts=[("Awarded", "June 2017")]),
]

# Computing skills, grouped by purpose (shown as cards in the CV section).
TOOLKIT = [
    ("Programming", ["Wolfram Language", "Python", "C++", "Fortran", "Java"]),
    ("Event generation &amp; simulation", ["MadGraph", "Pythia", "Delphes"]),
    ("Analysis", ["ROOT", "MadAnalysis"]),
    ("Model building &amp; spectra", ["FeynRules", "SARAH", "SPheno"]),
    ("Diagrams &amp; amplitudes", ["FeynArts", "FeynCalc"]),
    ("Loop integrals &amp; reduction", ["FIESTA", "AMBRE", "MB", "Kira", "FIRE", "TOPCOM"]),
]

# The home page of each tool in the CV's Computing section (checked to load, October 2026).
TOOL_URLS = {
    "MadGraph": "https://launchpad.net/mg5amcnlo", "Pythia": "https://pythia.org/", "Delphes": "https://delphes.github.io/",
    "ROOT": "https://root.cern/", "MadAnalysis": "https://madanalysis.irmp.ucl.ac.be/", "FeynRules": "https://feynrules.irmp.ucl.ac.be/",
    "SARAH": "https://sarah.hepforge.org/", "SPheno": "https://spheno.hepforge.org/", "FeynArts": "https://feynarts.de/",
    "FeynCalc": "https://feyncalc.github.io/", "FIESTA": "https://gitlab.com/feynmanintegrals/fiesta", "AMBRE": "https://jgluza.us.edu.pl/ambre/",
    "MB": "https://mbtools.hepforge.org/", "Kira": "https://kira.hepforge.org/", "FIRE": "https://gitlab.com/feynmanintegrals/fire",
    "TOPCOM": "https://www.wm.uni-bayreuth.de/de/team/rambau_joerg/TOPCOM/",
}

LANGUAGES = [("English", "Professional"), ("Bengali", "Native"), ("Hindi", "Fluent"), ("German", "Beginner")]

# ==========================================================================
# Rendering
# ==========================================================================

def authors_html(s):
    parts = [a.strip() for a in s.split(",")]
    keep = lambda a: a.replace(" ", "&nbsp;")          # "S. Banik" never splits across lines
    return ", ".join(f'<span class="me">{keep(a)}</span>' if a == ME else
                     f'<span class="au">{keep(a)}</span>' if "-" in a else keep(a) for a in parts)   # nor "U.-G. Meißner" at its hyphen


TOPIC_LABEL = {"fi": "Feynman integrals", "pheno": "Phenomenology", "soft": "Software"}


_TOUR = None


def tour_papers():
    """arXiv ids (or a DOI) of the papers that have an animation in the paper tour on the Research page."""
    import re
    global _TOUR
    if _TOUR is None:
        _TOUR = set(re.findall(r"paper: '([^']+)'", Path("assets/scenes.js").read_text(encoding="utf-8")))   # arXiv ids, or a DOI
    return _TOUR


DOWNLOAD_ICON = ('<svg class="dl" viewBox="0 0 16 16" aria-hidden="true">'
                 '<path d="M8 2.5v7.5M4.6 6.8 8 10.2l3.4-3.4M3 13.5h10"/></svg>')


# ---------------------------------------------------------------- publication details
# The abstract, length and preprint numbers shown when a publication is opened, from tools/pub_details.json
# (written by tools/pub_details.py from INSPIRE and arXiv).
try:
    PUB_DETAILS = json.loads(Path("tools/pub_details.json").read_text(encoding="utf-8"))
except (OSError, ValueError):
    PUB_DETAILS = {}
try:                                              # the research proposal behind each postdoctoral fellowship or grant
    FUND_PROPOSALS = json.loads(Path("tools/proposals.json").read_text(encoding="utf-8"))
except (OSError, ValueError):
    FUND_PROPOSALS = {}

_TEX_SYM = {"alpha": "α", "beta": "β", "gamma": "γ", "delta": "δ", "epsilon": "ε", "varepsilon": "ε", "zeta": "ζ",
            "eta": "η", "theta": "θ", "lambda": "λ", "mu": "μ", "nu": "ν", "xi": "ξ", "pi": "π", "rho": "ρ",
            "sigma": "σ", "tau": "τ", "phi": "φ", "varphi": "φ", "chi": "χ", "psi": "ψ", "omega": "ω",
            "Gamma": "Γ", "Delta": "Δ", "Theta": "Θ", "Lambda": "Λ", "Sigma": "Σ", "Phi": "Φ", "Psi": "Ψ", "Omega": "Ω",
            "to": "→", "rightarrow": "→", "approx": "≈", "simeq": "≃", "sim": "∼", "pm": "±", "mp": "∓", "times": "×",
            "cdot": "·", "geq": "≥", "leq": "≤", "geqslant": "⩾", "leqslant": "⩽", "gtrapprox": "⪆", "lessapprox": "⪅",
            "gtrsim": "≳", "lesssim": "≲", "prime": "′", "ell": "ℓ", "infty": "∞", "partial": "∂", "neq": "≠",
            "propto": "∝", "ldots": "…", "dots": "…", "%": "%", "{": "{", "}": "}", ",": " ", ";": " ", ":": " ",
            "!": "", " ": " ", "quad": " ", "qquad": " ", "&": "&amp;", "$": "$", "#": "#", "_": "_"}


def _tex_math(src):
    """A little TeX for the maths in abstracts: letters in italics, scripts, bars, Greek and the usual signs."""
    i, n = 0, len(src)

    def group():
        nonlocal i
        if i < n and src[i] == "{":
            i += 1
            return seq("}")
        return seq(None, one=True)

    def seq(close, one=False, upright=False):
        nonlocal i
        out = []
        while i < n:
            c = src[i]
            if close and c == close:
                i += 1
                break
            if c == "{":
                i += 1
                out.append(seq("}", upright=upright))
            elif c in "^_":
                i += 1
                tag = "sup" if c == "^" else "sub"
                out.append(f"<{tag}>{group()}</{tag}>")
            elif c == "\\":
                m = re.match(r"\\([A-Za-z]+|.)", src[i:])
                cmd = m.group(1)
                i += len(m.group(0))
                if cmd in ("bar", "overline"):
                    while i < n and src[i] == " ":
                        i += 1
                    out.append(f'<span class="ov">{group()}</span>')
                elif cmd in ("rm", "mathrm"):
                    if cmd == "mathrm":
                        out.append(_upright(group()))
                    else:
                        upright = True
                elif cmd in ("text", "textrm", "mbox"):
                    out.append(_upright(group()))
                else:
                    out.append(_TEX_SYM.get(cmd, cmd))
            elif c == "~":
                out.append(" ")
                i += 1
            elif c.isalpha() and c.isascii():
                j = i
                while j < n and src[j].isalpha() and src[j].isascii():
                    j += 1
                word = src[i:j]
                out.append(word if upright else f"<i>{word}</i>")
                i = j
            else:
                out.append({"<": "&lt;", ">": "&gt;", "&": "&amp;"}.get(c, c))
                i += 1
            if one and out:
                break
        return "".join(out)

    return seq(None)


def _upright(html):
    return re.sub(r"</?i>", "", html)


# Slips in the abstracts as INSPIRE and arXiv give them, put right on the site
ABSTRACT_FIXES = {"geometrical objets": "geometrical objects"}     # 2402.04174


def _tex_html(text):
    """An abstract with its TeX turned into HTML: maths between dollars, quotes, and plain hyphens."""
    import html as _html
    for slip, fix in ABSTRACT_FIXES.items():
        text = text.replace(slip, fix)
    parts = re.split(r"(\$[^$]*\$)", text.replace("\n", " "))
    out = []
    for k, part in enumerate(parts):
        if part.startswith("$") and part.endswith("$") and len(part) > 1:
            out.append(_tex_math(part[1:-1]))
        else:
            t = _html.escape(part, quote=False).replace("``", "“").replace("''", "”").replace("~", " ")
            t = re.sub(r"\s*\\cite\{[^}]*\}", "", t)            # citations stay in the paper
            t = re.sub(r"\\%", "%", t).replace("\\,", "\u202f").replace("---", ", ").replace("--", "-").replace("–", "-").replace("—", ", ")
            t = re.sub(r"\\([A-Za-z]+)", lambda m: _TEX_SYM.get(m.group(1), m.group(1)), t)
            out.append(t)
    return re.sub(r"\s+", " ", "".join(out)).strip()


_RELATED_STOP = set("""about above after again against also among analysis approach based been being between both case cases certain
class compute computed computing consider contribution contributions corresponding derive derived different discuss each either example
examples first found framework from further general given have having here however illustrate important including into known large lead
like main make many method methods more most much obtain obtained other order over paper particular possible present presented problem
provide recent recently related respectively result results same several show shown simple since some such than that their them then
there these they this those three through thus under used using various very well were what when where which while with within work
would will our can article""".split())
_RELATED = {}


def _paper_vectors():
    """Each paper as a unit vector of the words of its title and abstract, each word weighted by how rare it is
    among the papers (tf-idf), the title counting twice."""
    import math
    from collections import Counter
    words = {}
    for q in PUBS:
        t = _plain(q["title"])
        text = f'{t} {t} {_plain(_tex_html(PUB_DETAILS.get(q.get("inspire", ""), {}).get("abstract", "")))}'
        words[_pub_id(q)] = [w for w in re.findall(r"[a-z][a-z0-9-]{3,}", text.lower()) if w not in _RELATED_STOP]
    n = len(words)
    df = Counter(w for ws in words.values() for w in set(ws))
    vec = {}
    for k, ws in words.items():
        v = {w: c / len(ws) * math.log(n / df[w]) for w, c in Counter(ws).items() if df[w] < n}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1
        vec[k] = {w: x / norm for w, x in v.items()}
    return vec


def paper_map_data():
    """The papers on a plane, placed by the words they share: classical multidimensional scaling of the distances
    between their word vectors (the two leading eigenvectors of the doubly centred matrix of squared distances).
    The first direction runs from the phenomenology papers to the mathematical ones, and it is turned so that
    phenomenology is on the left. The second is turned so that the paper farthest from the middle is at the top, and
    spread with an arcsinh about its median, so that the crowded groups open up."""
    import math
    vec = _paper_vectors()
    order = sorted(PUBS, key=lambda p: (int(p["year"]), p.get("arxiv") or "9999.99999"))
    ids = [_pub_id(p) for p in order]
    n = len(ids)
    D2 = [[2 * (1 - sum(x * vec[b].get(w, 0) for w, x in vec[a].items())) for b in ids] for a in ids]
    r = [sum(row) / n for row in D2]
    g = sum(r) / n
    B = [[-0.5 * (D2[i][j] - r[i] - r[j] + g) for j in range(n)] for i in range(n)]
    def leading(defl):                                   # power iteration, from a fixed start so that every build agrees
        v = [math.sin(i + 1.0) for i in range(n)]
        for _ in range(400):
            w = [sum(B[i][j] * v[j] for j in range(n)) for i in range(n)]
            for u in defl:
                d = sum(a * b for a, b in zip(w, u))
                w = [a - d * b for a, b in zip(w, u)]
            nr = math.sqrt(sum(a * a for a in w)) or 1
            v = [a / nr for a in w]
        return sum(v[i] * sum(B[i][j] * v[j] for j in range(n)) for i in range(n)), v
    l1, v1 = leading([])
    l2, v2 = leading([v1])
    xs = [a * math.sqrt(max(l1, 0)) for a in v1]
    ys = [a * math.sqrt(max(l2, 0)) for a in v2]
    ph = [x for x, p in zip(xs, order) if p["topic"] == "pheno"]
    if ph and sum(ph) / len(ph) > 0:
        xs = [-x for x in xs]
    if ys[max(range(n), key=lambda i: abs(ys[i]))] < 0:
        ys = [-y for y in ys]
    med = sorted(ys)[n // 2]                             # the up and down spread of the crowded groups, with the far one kept in reach
    mad = sorted(abs(y - med) for y in ys)[n // 2] or 1e-6
    ys = [math.asinh((y - med) / mad) for y in ys]
    def unit(a):
        lo, hi = min(a), max(a)
        return [round((v - lo) / ((hi - lo) or 1), 4) for v in a]
    X, Y, place = unit(xs), unit(ys), {k: i for i, k in enumerate(ids)}
    return [dict(x=X[i], y=Y[i], t="pheno" if p["topic"] == "pheno" else "fi", k=p["kind"], yr=int(p["year"]),
                 n=_plain(p["title"]).strip(), r=_plain(p["ref"]).strip(), u=f"publications.html#{_pub_id(p)}",
                 e=[place[_pub_id(q)] for q in _related(p)]) for i, p in enumerate(order)]


def render_paper_map():
    import json
    pts = paper_map_data()
    blob = json.dumps(pts, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return ('<figure class="pmap" aria-labelledby="pmap-cap">\n'
            f'<p class="pmap-lede">Each dot is one of the {len(pts)} papers, placed by the words its title and abstract share with '
            'the others, so that papers on the same subject sit close together. A line joins each paper to the three closest to it.</p>\n'
            '<div class="pmap-box"><canvas class="pmap-plot" role="img" aria-label="A map of the papers by subject, '
            'from the search for new Higgs bosons on the left to the mathematics of Feynman integrals on the right."></canvas></div>\n'
            '<div class="pmap-foot"><p class="pmap-read" id="pmap-cap"></p>'
            '<ul class="pmap-key" aria-hidden="true"><li class="k-fi">Feynman integrals</li><li class="k-ph">Phenomenology</li>'
            '<li class="k-pr">Proceedings</li></ul></div>\n'
            f'<script type="application/json" class="pmap-data">{blob}</script>\n'
            '</figure>\n' + PMAP_JS)


def _related(p):
    """The papers closest to this one, at most three: by the words of their titles and abstracts (each word weighted
    by how rare it is among the papers, the title counting twice), then the research domains and co-authors they share."""
    if not _RELATED:
        vec = _paper_vectors()
        def coauthors(q):
            return {a.strip() for a in _plain(q["authors"]).split(",")} - {"S. Banik"}
        for q in PUBS:
            k, scored = _pub_id(q), []
            for r in PUBS:
                k2 = _pub_id(r)
                if k2 == k:
                    continue
                cos = sum(x * vec[k2].get(w, 0) for w, x in vec[k].items())
                if cos < .08:                        # a shared domain alone does not make two papers related
                    continue
                score = cos + .08 * len(set(_domains_of(q)) & set(_domains_of(r))) + .04 * min(3, len(coauthors(q) & coauthors(r)))
                scored.append((score, r["year"], r))
            scored.sort(key=lambda x: (-x[0], -x[1]))
            _RELATED[k] = [r for _s, _y, r in scored[:3]]
    return _RELATED.get(_pub_id(p), [])


def _ref_button(p):
    """The paper as one line of text, for a CV, a slide or an email: authors, title, journal and arXiv number."""
    import html as _html
    parts = [_plain(p["authors"]).strip(), _plain(p["title"]).strip(), _plain(p["ref"]).strip()]
    if p.get("arxiv"):
        parts.append(f'arXiv:{p["arxiv"]}')
    line = ", ".join(x for x in parts if x)
    return (f'<button class="cite-copy ref-copy" type="button" data-done="Reference copied" data-copy="{_html.escape(line, quote=True)}" '
            f'title="{_html.escape(line, quote=True)}">'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5"/>'
            '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/></svg><span class="cc-l">Copy reference</span></button>')


def _pub_more(p):
    """What opens under a publication: its abstract, length, preprint numbers and arXiv category."""
    d = PUB_DETAILS.get(p.get("inspire", ""), {})
    if not d.get("abstract"):
        return ""
    c = d.get("comment", "")
    def count(word):
        m = re.search(rf"(\d+)\s+{word}", c)
        return int(m.group(1)) if m else None
    pages = count("pages") or d.get("pages")
    length = [f"{pages} pages"] if pages else []
    for word, one in (("figures?", "figure"), ("tables?", "table")):
        k = count(word)
        if k:
            length.append(f"{k} {one}{'' if k == 1 else 's'}")
    facts = []
    if length:
        facts.append(("Length", " · ".join(length)))
    if d.get("reports"):
        facts.append(("Preprint", " · ".join(d["reports"])))
    if p.get("arxiv") and d.get("cat"):
        facts.append(("arXiv", f'{p["arxiv"]} [{d["cat"]}]'))
    if d.get("cited"):                             # how often it has been cited, as INSPIRE counted it when the data was read
        when = date.fromisoformat(d["cited_on"]).strftime("%B %Y") if d.get("cited_on") else ""
        facts.append(("Citations", f'<a class="cites" href="https://inspirehep.net/literature?q=refersto%3Arecid%3A{p["inspire"]}" '
                                   f'title="The papers that cite it, on INSPIRE">{d["cited"]}</a>'
                                   + (f' <span class="muted">(INSPIRE, {when})</span>' if when else "")))
    facts_html = "".join(f'<div><span class="k">{k}</span>{v}</div>' for k, v in facts)
    cite = ""
    if d.get("bibtex", "").startswith("@"):        # the BibTeX entry, copied with one click (or read on INSPIRE)
        import html as _html
        key = re.match(r"@\w+\{([^,]+),", d["bibtex"])
        cite = (f'<div class="pub-cite"><span class="k">Cite</span>'
                f'<button class="cite-copy" type="button" data-copy="{_html.escape(d["bibtex"], quote=True)}">'
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5"/>'
                '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/></svg><span class="cc-l">Copy BibTeX</span></button>'
                f'{_ref_button(p)}'
                f'<a class="cite-raw" href="https://inspirehep.net/api/literature/{p["inspire"]}?format=bibtex">'
                f'{key.group(1) if key else "BibTeX"}</a><span class="sr-only" role="status" aria-live="polite"></span></div>')
    rel = _related(p)
    rel_html = ("" if not rel else '<div class="pub-rel"><span class="k">Related papers</span><ul>' + "".join(
        f'<li style="--k:{k}"><a href="#{_pub_id(r)}">{r["title"]}</a> <span class="muted">{r["year"]}</span></li>' for k, r in enumerate(rel)) + '</ul></div>')
    return (f'<div class="pub-abs"><p class="abstract"><span class="k">Abstract</span>{_tex_html(d["abstract"])}</p>'
            f'<div class="pub-facts">{facts_html}</div>{rel_html}{cite}</div>')


# Beside each section heading, on hover: a link that copies the address of that section (as GitHub does it,
# hidden from screen readers and the tab order, since the address bar does the same)
SEC_LINK_ICON = ('<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.1 1.1"/>'
                 '<path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.1-1.1"/></svg>')
SEC_LINK_JS = """<script>
(function () {                              // copy the address of a section, and say so
  var ok = navigator.clipboard && window.isSecureContext;
  Array.prototype.forEach.call(document.querySelectorAll('.sec-link'), function (a) {
    var timer;
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href').slice(1), url = location.origin + location.pathname + '#' + id;
      if (!ok) return;                        // (then the link just goes to the section)
      ev.preventDefault();
      navigator.clipboard.writeText(url).then(function () {
        if (history.replaceState) history.replaceState(null, '', '#' + id);
        a.classList.add('done'); clearTimeout(timer); timer = setTimeout(function () { a.classList.remove('done'); }, 1800);
      }).catch(function () { location.hash = id; });
    });
  });
})();
</script>"""


PERMA_JS = """<script>
(function () {                              // copy the address of one paper on this page, and say so
  var ok = navigator.clipboard && window.isSecureContext;
  Array.prototype.forEach.call(document.querySelectorAll('.perma'), function (b) {
    var label = b.querySelector('.pl-l'), timer;
    b.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + b.dataset.id;
      if (!ok) { location.hash = b.dataset.id; return; }
      navigator.clipboard.writeText(url).then(function () {
        b.classList.add('done'); label.textContent = 'Link copied';
        clearTimeout(timer); timer = setTimeout(function () { b.classList.remove('done'); label.textContent = 'Link'; }, 2000);
      }).catch(function () { location.hash = b.dataset.id; });
    });
  });
})();
</script>"""


CITE_JS = """<script>
(function () {                              // copy a paper's BibTeX with one click, and say so
  var bs = document.querySelectorAll('.cite-copy:not(.bib-all)');   // (the one for the whole list is in the page script)
  if (!bs.length) return;
  var ok = navigator.clipboard && window.isSecureContext;
  Array.prototype.forEach.call(bs, function (b) {
    if (!ok) { b.remove(); return; }
    var label = b.querySelector('.cc-l'), said = b.parentNode.querySelector('[role=status]'), timer, orig = label.textContent;
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
        var done = b.getAttribute('data-done') || 'BibTeX copied';
        b.classList.add('done'); label.textContent = done; if (said) said.textContent = done;
        clearTimeout(timer);
        timer = setTimeout(function () { b.classList.remove('done'); label.textContent = orig; if (said) said.textContent = ''; }, 2200);
      }).catch(function () {});
    });
  });
})();
</script>"""


def _pub_id(p):
    """The anchor of a paper on the Publications page, from its arXiv number where it has one."""
    return f'arxiv-{p["arxiv"]}' if p.get("arxiv") else f'inspire-{p["inspire"]}' if p.get("inspire") else _slug(p["title"])


def render_coauthors(least=4):
    """The co-authors of four papers or more, most frequent first: a click shows the papers written with them."""
    from collections import Counter
    count = Counter(a.strip() for p in PUBS for a in _plain(p["authors"]).split(",") if a.strip() and a.strip() != "S. Banik")
    people = [(a, n) for a, n in count.most_common() if n >= least]
    chips = "".join(f'<button type="button" data-q="{a.lower()}" data-name="{a}" aria-pressed="false">{a}<span class="ca-n">{n}</span></button>'
                    for a, n in people)
    return (f'<div class="coauthors" role="group" aria-label="Frequent co-authors"><span class="ca-l">Frequent co-authors</span>{chips}</div>'
            if people else "")


def _html_attr(text):
    import html as _html
    return _html.escape(text, quote=True)


def _domain_slugs():
    return {k: _slug(name) for k, (name, _t, _k) in zip(DOMAIN_KEYS, DOMAINS)}


def _domains_of(p):
    """The research domains of a paper, as the slugs of their names (every paper must have at least one)."""
    keys = PAPER_DOMAINS[p.get("arxiv") or p.get("inspire")].split()
    return [_domain_slugs()[k] for k in keys]


def _pub_link(arx):
    return f'publications.html#{_pub_id(_paper(arx))}'


def _soft_of(p):
    """The package or library that came with a paper, for a link to its card on the Software page."""
    for k in PACKAGES + [LIBRARY]:
        if p.get("code") == k["repo"] or (p.get("arxiv") and p.get("arxiv") == k["paper"]):
            return k
    return None


def pub_entry(n, p):
    import html as _html
    links = []
    if p.get("arxiv"):                         # the PDF on arXiv, as a small version of the CV button
        label = _html.escape(f"Download the PDF of {_plain(p['title'])} from arXiv", quote=True)
        links.append(f'<a class="button pdf" href="https://arxiv.org/pdf/{p["arxiv"]}" aria-label="{label}">'
                     f'{DOWNLOAD_ICON}Download PDF</a>')
        links.append(f'<a class="arx" href="https://arxiv.org/abs/{p["arxiv"]}">arXiv:{p["arxiv"]}</a>')
    if p.get("doi"):
        links.append(f'<a href="https://doi.org/{p["doi"]}">DOI</a>')
    if p.get("erratum"):                       # a correction the journal published later
        links.append(f'<a href="https://doi.org/{p["erratum"]}" title="The correction published by the journal">Correction</a>')
    if p.get("inspire"):
        links.append(f'<a href="https://inspirehep.net/literature/{p["inspire"]}">INSPIRE</a>')
    soft = _soft_of(p)
    if soft:                                   # the code, with its versions and installation, on the Software page
        links.append(f'<a href="software.html#{soft["slug"]}" title="{soft["name"]} on the Software page">Code</a>')
    elif p.get("code"):
        links.append(f'<a href="{p["code"]}">Code</a>')
    key = p.get("arxiv") or p.get("doi")
    tour = key if key in tour_papers() else p.get("tour")   # proceedings point to their paper's animation
    if tour:
        links.append(f'<a href="research.html#tour-{tour}" title="See this work in the animated tour">Animation</a>')
    venue = f' <span class="sep">·</span> {p["venue"]}' if p.get("venue") else ""
    links.append(f'<button class="perma" type="button" data-id="{_pub_id(p)}" title="Copy a link to this paper on this page">'
                 '<span class="pl-l">Link</span></button>')       # a link to this very entry, to share
    tags = "".join(f'<span class="tag {t}">{TOPIC_LABEL[t]}</span>' for t in p["topic"].split())
    links.append(f'<span class="tags">{tags}</span>')
    more = _pub_more(p)
    head = (f'<span class="title">{p["title"]}</span>'
            f'<span class="meta">{authors_html(p["authors"])}</span>'
            f'<span class="detail"><span class="muted">{p["ref"]}</span>{venue}</span>')
    if more:                                   # the title, authors and journal open the abstract and the details
        head = (f'<details class="pub-open"><summary>{head}<span class="pub-toggle"><span class="t-show">Abstract and details</span>'
                f'<span class="t-hide">Hide abstract</span>{PKG_CHEVRON}</span></summary>{more}</details>')
    return (
        f'<div class="entry pub" id="{_pub_id(p)}" data-topic="{p["topic"]}" data-domains="{" ".join(_domains_of(p))}" '
        f'data-n="{n}" data-cited="{PUB_DETAILS.get(p.get("inspire", ""), {}).get("cited", 0)}">'
        f'<div class="rail">[{n}]<br>{p["year"]}</div><div class="body">'
        + head +
        f'<div class="links">{" ".join(links)}</div>'
        f'</div></div>'
    )


def render_pubs():
    groups = [("article", "Journal articles"),
              ("proceedings", "Conference proceedings"),
              ("thesis", "Thesis")]
    total = len(PUBS)
    n = total
    out = []
    for kind, label in groups:
        items = [p for p in PUBS if p["kind"] == kind]
        out.append(f'<h3 class="sect" data-group="{kind}">{label}</h3>')
        for p in items:
            out.append(pub_entry(n, p))
            n -= 1
    return "\n".join(out) + "\n" + CITE_JS + PERMA_JS


def _p(d, cls=""):
    attr = ' class="%s"' % cls if cls else ""
    return f'<path{attr} pathLength="1" d="{d}"/>'


def _pf(d, length, cls=""):
    """A line that, on hover, runs along its own direction: dashes 2.6 long with gaps of 2.2 (in drawing
    units), given as fractions of the path length because the paths are normalized to pathLength 1."""
    c = ("flow " + cls).strip()
    return (f'<path class="{c}" pathLength="1" style="--da:{2.6 / length:.4f};--dg:{2.2 / length:.4f};--dp:{4.8 / length:.4f}"'
            f' d="{d}"/>')


def _dots(pts, r=1.6):
    return "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y in pts)


# a small line drawing for each research domain, in the order of DOMAINS
def _cone_dots(pts, r):                     # the lattice points of the cone, numbered outwards from its apex
    order = sorted(pts, key=lambda q: (q[0] - 6) ** 2 + (q[1] - 26) ** 2)
    return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" style="--k:{order.index((x, y))}"/>' for x, y in pts)


# On hover each drawing does what it stands for (see style.css): the terms of a series fill its cone,
# a loop momentum runs around the box, an excess shows in a mass window, the cursor blinks after the code,
# the couplings run with the scale, and a new particle is exchanged between two vertices.
DOMAIN_ICONS = [
    _p("M6 26H44M6 26L30 3") + _cone_dots([(14, 22), (22, 22), (30, 22), (38, 22), (20, 16), (28, 16), (36, 16), (26, 10), (34, 10)], 1.3),
    _p("M16 8H32V22H16Z") + _p("M16 8L9 2M32 8L39 2M16 22L9 28M32 22L39 28", "thin") + _dots([(16, 8), (32, 8), (16, 22), (32, 22)], 1.7)
    + '<circle class="run" cx="16" cy="8" r="1.5"/>',
    '<rect class="win" x="22.5" y="4" width="7" height="23" rx="1"/>'
    + _p("M4 27H44", "thin") + _p("M5 5C12 13 16 18 20 18C23 18 23 11 26 11C29 11 29 20 33 21C37 22 40 22 44 23")
    + _dots([(9, 10), (15, 16), (26, 11), (35, 21)], 1.3),
    _p("M40 3H44V27H40") + _p("M5 8H29M5 14H23M5 20H33", "thin") + '<circle class="cur" cx="36" cy="20" r="1.6"/>',
    _p("M4 28H44", "thin") + _p("M4 5L44 16M4 18L44 14M4 25L44 17")
    + "".join(f'<circle class="run" cx="4" cy="{y}" r="1.3" style="--dx:40px;--dy:{dy}px"/>' for y, dy in ((5, 11), (18, -4), (25, -8))),
    _p("M4 4L16 15L4 26M44 4L32 15L44 26") + _p("M16 15H19M22.5 15H25.5M29 15H32", "thin") + _dots([(16, 15), (32, 15)], 1.8)
    + '<circle class="run" cx="16" cy="15" r="1.5"/>',
]


def _ix(body, cls="ix", box="0 0 48 30"):
    return f'<svg class="{cls}" viewBox="{box}" aria-hidden="true">{body}</svg>'


# small drawings for the cards inside the pages: selected papers, software, courses, students, contact
CONE = _p("M6 26H44M6 26L30 3") + _cone_dots([(14, 22), (22, 22), (30, 22), (38, 22), (20, 16), (28, 16), (36, 16), (26, 10)], 1.3)   # its points light up on hover
PAPER_ICONS = {
    "2510.08682": _p("M4 5L18 15L4 25M44 5L30 15L44 25", "thin") + _p("M24 9A6 6 0 1 1 23.9 9Z") + _p("M20 11L28 19M20 19L28 11"),
    "2012.15108": CONE,
    "2306.15722": _p("M4 15H8M11 15H15M18 15H22", "thin") + _pf("M22 15C24 12 25 12 27 10S30 8 32 6S36 4 44 3M22 15C24 18 25 18 27 20S30 22 32 24S36 26 44 27", 52.23)
                  + _dots([(22, 15)], 1.8),
}
# SLQ-RG: the three gauge couplings (as 1/α) against the log of the scale, from the Z mass to 10^13.5 GeV, at one loop
# with the coefficients of the paper. At the leptoquark mass (the line, all five at 125 TeV as in its Fig. 5) every
# slope changes, 1/α2 nearly stops, and the three then meet near 10^13 GeV. On hover the couplings run.
LIBRARY_ICON = (_p("M4 28H44", "thin") + _p("M14.9 3V28", "thin")
                + _pf("M4 6L14.9 7.8L42 15.3", 39.17) + _pf("M4 17L14.9 15.6L42 15.4", 38.09) + _pf("M4 24.8L14.9 21.8L42 16", 39.02)
                + "".join(f'<circle cx="14.9" cy="{y}" r="1.4" style="--k:{k}"/>' for k, y in enumerate((7.8, 15.6, 21.8))))
SOFTWARE_ICONS = {
    "MBConicHulls": CONE,
    "FeynGKZ": _p("M14 4H34L44 15L34 26H14L4 15Z")       # the polytope, triangulated spoke by spoke on hover
               + "".join(f'<path class="thin step" pathLength="1" style="--k:{k}" d="M24 15L{x} {y}"/>'
                         for k, (x, y) in enumerate([(14, 4), (34, 4), (44, 15), (34, 26), (14, 26), (4, 15)]))
               + '<circle cx="24" cy="15" r="1.8" style="--k:0"/>',
    "HyperPrecision": _p("M24 3A12 12 0 1 1 23.9 3Z") + _p("M24 8A7 7 0 1 1 23.9 8Z", "thin focus") + _p("M4 15H12M36 15H44", "thin") + _dots([(24, 15)], 2),
}
COURSE_ICONS = [
    ("Proseminar", _p("M7 3H41V20H7Z") + _p("M24 20V27M16 27H32M11 15Q17 6 23 11T37 7", "thin")),
    # on hover: the sides of the unitarity triangle run head to tail, the electron runs through the vertex
    # and the photon leaves it, and the field lines run from the positive charge (left) to the negative one
    ("Flavour", _pf("M5 25H43L17 5Z", 94.13) + _p("M10 25A5 5 0 0 0 8.4 21.4M38 25A5 5 0 0 1 39.9 21.9", "thin") + _dots([(5, 25), (43, 25), (17, 5)], 1.6)),
    ("Quantum Field", _pf("M4 27L22 15L4 3", 43.27) + _pf("M22 15Q24 11 26 15T30 15T34 15T38 15T42 15", 29.58, "thin") + _dots([(22, 15)], 1.8)),
    ("Introductory Physics", _pf("M12 15H36", 24) + _pf("M12 15C17 6 31 6 36 15M12 15C17 24 31 24 36 15M12 15C15 -2 33 -2 36 15M12 15C15 32 33 32 36 15", 133.99, "thin")
     + _dots([(12, 15), (36, 15)], 2.6)),
]
STUDENT_ICONS = [
    # on hover: the integration contour runs upwards, from -i infinity to +i infinity, and the decay products fly apart
    ("Mellin-Barnes", _pf("M24 28V2", 26) + _dots([(16, 15), (10, 15), (4, 15)], 1.6) + _dots([(31, 15), (37, 15), (43, 15)], 1.6)),
    ("two-body", _pf("M4 15H22", 18) + _pf("M22 15L42 5M22 15L42 25", 44.72, "thin") + _dots([(22, 15)], 1.8)),
    # a propagator with a one-loop bubble and then the two-loop sunset: the line stops at each loop
    ("perturbative", _pf("M2 15H10M18 15H28M38 15H46", 26, "thin") + _p("M18 15A4 4 0 1 1 18 14.9M38 15A5 5 0 1 1 38 14.9") + _p("M28 15H38", "thin")),
]
REACH_ICONS = {
    "Email": _p("M6 6H42V25H6Z") + _p("M6 6L24 17L42 6", "thin"),
    "Address": _p("M24 28C24 28 14 18 14 11A10 10 0 1 1 34 11C34 18 24 28 24 28Z") + _p("M24 7.5A3.5 3.5 0 1 1 23.9 7.5Z", "thin"),
    "Profiles": _p("M10 22L24 8L38 22M10 22H38", "thin") + _dots([(10, 22), (24, 8), (38, 22)], 2.4),
}


def _pick_icon(items, text):
    for key, body in items:
        if key in text:
            return _ix(body)
    return ""


def render_domains():
    """Each domain card opens what it is about: its papers on the Publications page, or for the tools the
    Software page. The whole card is the link, and the names of the packages inside it link to their cards."""
    out = []
    for i, (key, (name, text, keys)) in enumerate(zip(DOMAIN_KEYS, DOMAINS), 1):
        slug = _slug(name)
        n = sum(slug in _domains_of(p) for p in PUBS)
        if key == "tools":
            href, go = "software.html", f"{NUMBER_WORDS[len(PACKAGES)].capitalize()} packages and a library"
        else:
            href, go = f"publications.html?domain={slug}#publications", f"{n} papers" if n != 1 else "One paper"
        out.append(f'<div class="theme d{i}"><svg class="th-icon" viewBox="0 0 48 30" aria-hidden="true">{DOMAIN_ICONS[i - 1]}</svg>'
                   f'<h4>{name}</h4><p>{text}</p><div class="keys">{keys}</div>'
                   f'<a class="th-go" href="{href}" aria-label="{name}: {go}">{go} <span aria-hidden="true">→</span></a></div>')
    return "\n".join(out)


def render_journey():
    out = []
    last = len(JOURNEY) - 1
    for i, (year, city, role, inst, logos) in enumerate(JOURNEY):
        imgs = "".join(f'<span class="logo-disc{" wide" if f in ("slac",) else ""}">{_logo(f, alt)}</span>'
                       for f, alt in logos)                    # each logo on a white disc of its own (a wordmark sits smaller)
        now = ' now' if i == last else ''
        badge = '<span class="j-now">Now</span>' if i == last else ''
        mine = {f for f, _ in logos}                     # the CV entry of this stop: the first with one of its logos
        cv = next((e for e in EMPLOYMENT + EDUCATION if mine & {f for f, _ in e["logos"]}), None)
        go = (f'<a class="stop-go" href="cv.html#{_cv_id(cv)}" aria-label="{city}, {_plain(role)}, in the CV"></a>' if cv else "")
        out.append(
            f'<li class="stop{now}" style="--i:{i}"><div class="stop-node n{len(logos)}">{imgs}</div>'
            f'<div class="stop-year">{year}{badge}</div><div class="stop-city">{city}</div>'
            f'<div class="stop-role">{role}</div><div class="stop-inst">{inst}</div>{go}</li>')
    return "\n".join(out)


def _natural_earth(lon, lat):
    """Natural Earth I projection, identical to tools/make_world_dots.py."""
    import math
    lam, phi = math.radians(lon), math.radians(lat)
    p2 = phi * phi
    p4 = p2 * p2
    x = lam * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
    y = phi * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    return x, y


def _map_projector():
    """The projection of the dotted world map: (lat, lon) to map units."""
    import json
    m = json.loads(Path("assets/map/world-dots.json").read_text())
    x_min, _ = _natural_earth(-180, 0)
    x_max, _ = _natural_earth(180, 0)
    _, y_top = _natural_earth(0, m["lat_top"])
    scale = m["width"] / (x_max - x_min)

    def project(lat, lon):
        x, y = _natural_earth(lon, lat)
        return round((x - x_min) * scale, 1), round((y_top - y) * scale, 1)
    return m, project


def visitor_assets():
    """The dotted world for the footer map, and where each country sits on it with its name (read by tools/visitors.py)."""
    import csv
    import json
    m, project = _map_projector()
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {m["width"]} {m["height"]}"><path d="{m["path"]}" '
           'fill="none" stroke="#c9a96a" stroke-width="3.4" stroke-linecap="round"/></svg>\n')
    lines = [l for l in Path("tools/country-centroids.csv").read_text(encoding="utf-8").splitlines() if not l.startswith("#")]
    where = {code: [*project(float(lat), float(lon)), name] for code, lat, lon, name in list(csv.reader(lines))[1:]}
    for path, text in (("assets/map/world-dots.svg", svg),
                       ("assets/map/countries.json", json.dumps(where, separators=(",", ":")) + "\n")):
        f = Path(path)
        if not f.exists() or f.read_text(encoding="utf-8") != text:   # unchanged files keep their dates
            f.write_text(text, encoding="utf-8")


VISITORS_JS = """<script>
(function () {                              // the footer map of visitors, filled in from assets/visitors.json
  var box = document.querySelector('.visitors');
  if (!box || !window.fetch) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  fetch('/assets/visitors.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !(d.total > 0)) return;
    var list = d.countries || [], n = list.length, top = n ? list[0].v : 1, NS = 'http://www.w3.org/2000/svg';
    var svg = box.querySelector('.vis-dots');
    list.slice().reverse().forEach(function (c, i) {   // the busiest countries are drawn last, on top
      if (typeof c.x !== 'number') return;
      var r = 4.5 + 8.5 * Math.sqrt(c.v / top), g = document.createElementNS(NS, 'g'), rank = n - 1 - i;
      g.setAttribute('class', 'vis-pt' + (rank < 3 ? ' hot' : ''));
      g.setAttribute('transform', 'translate(' + c.x + ' ' + Math.min(476, Math.max(6, c.y)) + ')');
      g.style.setProperty('--k', i);
      g.innerHTML = '<circle class="halo" r="' + (2.7 * r).toFixed(1) + '"/><circle class="ring" r="' + r.toFixed(1) +
                    '"/><circle class="core" r="' + r.toFixed(1) + '"/>';
      var t = document.createElementNS(NS, 'title'); t.textContent = c.n; g.appendChild(t);
      svg.appendChild(g);
    });
    var s = d.total.toLocaleString('en-US'), cells = '';
    for (var k = 0; k <= 9; k++) cells += '<i>' + k + '</i>';
    box.querySelector('.vis-count').innerHTML = s.split('').map(function (ch, i) {
      return ch === ',' ? '<span class="od-sep">,</span>'
        : '<span class="od"><span class="od-strip" style="--n:' + ch + ';--i:' + i + '">' + cells + '</span></span>';
    }).join('');
    var since = new Date(d.since + 'T12:00:00Z').toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    var line = (d.total === 1 ? 'visit' : 'visits') + (n ? ' from ' + n + (n === 1 ? ' country' : ' countries') : '') + ' since ' + since;
    box.querySelector('.vis-label').textContent = line;
    box.querySelector('.sr-only').textContent = s + ' ' + line + '.';
    box.hidden = false;
    function roll() { box.classList.add('rolled'); }
    if (reduce || !('IntersectionObserver' in window)) { roll(); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); setTimeout(roll, 200); }
    }, { threshold: 0.5 });
    io.observe(box);
  }).catch(function () {});
})();
</script>"""


def render_visitors():
    """The footer block for the visitor map and count; it stays hidden until there are visits to show."""
    return ('<div class="visitors" hidden>\n'
            '    <div class="vis-map" aria-hidden="true">'
            f'<img src="/assets/map/world-dots.svg?v={_ver("assets/map/world-dots.svg")}" alt="" width="1200" height="482" loading="lazy">'
            '<svg class="vis-dots" viewBox="0 0 1200 482"><defs><radialGradient id="vis-glow">'
            '<stop offset="0" stop-color="#e6c983" stop-opacity=".55"/><stop offset="1" stop-color="#e6c983" stop-opacity="0"/>'
            '</radialGradient></defs></svg></div>\n'
            '    <div class="vis-count" aria-hidden="true"></div>\n'
            '    <div class="vis-label" aria-hidden="true"></div>\n'
            '    <p class="sr-only"></p>\n'
            '  </div>\n' + VISITORS_JS)


def talk_scene_data():
    """Talks in time order on the world map, with a view that frames them."""
    import re
    m, project = _map_projector()
    talks = []
    for year, event, city, _title, _note, invited in reversed(TALKS):
        x, y = project(*CITY_GEO[city])
        talks.append(dict(y=int(year), c=city, x=x, v=y, o=int("online" in event.lower()), i=int(invited)))
    xs, ys = [t["x"] for t in talks], [t["v"] for t in talks]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = x1 - x0, y1 - y0
    x0, x1, y0, y1 = x0 - 0.06 * w, x1 + 0.06 * w, y0 - 0.3 * h, y1 + 0.22 * h
    w, h = x1 - x0, y1 - y0
    if w / h > 2.2:                                   # grow the short side to a 2.2 : 1 frame
        y0, h = y0 - (w / 2.2 - h) / 2, w / 2.2
    else:
        x0, w = x0 - (2.2 * h - w) / 2, 2.2 * h
    y0 = min(max(y0, 0), m["height"] - h)             # and keep it on the map
    keep = []
    for ring in re.findall(r"M[^MZ]*Z", m["land"]):    # only the coastlines inside the frame
        nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", ring)]
        rx, ry = nums[0::2], nums[1::2]
        if max(rx) >= x0 and min(rx) <= x0 + w and max(ry) >= y0 and min(ry) <= y0 + h:
            keep.append(ring)
    grat = []
    lines = ([[(lat, lon) for lon in range(-180, 181, 3)] for lat in range(-45, 76, 15)]
             + [[(lat, lon) for lat in range(-51, 77, 4)] for lon in range(-180, 181, 15)])
    for line in lines:                                # a graticule every 15 degrees
        pts = [project(lat, lon) for lat, lon in line]
        pts = [(round(x), round(y)) for x, y in pts if x0 - 20 <= x <= x0 + w + 20 and y0 - 20 <= y <= y0 + h + 20]
        if len(pts) > 1:
            grat.append("M" + "L".join(f"{x} {y}" for x, y in pts))
    return dict(view=[round(x0, 1), round(y0, 1), round(w, 1), round(h, 1)], land="".join(keep),
                grat="".join(grat), talks=talks)


def pub_scene_data():
    """Papers in time order, with the field, the kind and a link for each, and the papers closest to each in
    content (the "Related papers" of the list, by their place in this order) for the lines drawn on hover."""
    pubs = []                                         # in time order: by year, and by arXiv number within a year
    order = sorted(reversed(PUBS), key=lambda p: (int(p["year"]), p.get("arxiv") or "9999.99999"))
    place = {_pub_id(p): i for i, p in enumerate(order)}
    for p in order:
        pubs.append(dict(y=int(p["year"]), t="pheno" if p["topic"] == "pheno" else "fi",   # a star opens its paper in the list below
                         k=p["kind"], n=p["title"], u=f"#{_pub_id(p)}", p=_plain(p["title"]).strip(),
                         r=[place[_pub_id(q)] for q in _related(p)]))
    return dict(pubs=pubs)


def _plain(text):
    import html as _html
    import re
    return _html.unescape(re.sub(r"<[^>]+>", "", text)).replace("\u00a0", " ")


def _precision_digits():
    """Digits for the HyperPrecision vignette: the Appell function F1(1; 1, 1; 2; x, y) at
    (x, y) = (-2, -3), outside the unit square where its series converges, reached along the
    ray (x, y) = (-2u, -3u) from the origin (u = 0) to the target (u = 1). Along the ray
    F(u) = F1(-2u, -3u) obeys u F' + F = 3/(1 + 3u) - 2/(1 + 2u). It is expanded about the
    regular singular point u = 0 and about the regular points u = 0.2, 0.32, 0.512 and 0.8192,
    each expansion truncated at order N and matched to the next, as in the paper's method.
    Higher N gives more correct digits of the exact value ln(4/3)."""
    from decimal import Decimal, getcontext
    getcontext().prec = 80
    centres = [Decimal(0), Decimal("0.2"), Decimal("0.32"), Decimal("0.512"), Decimal("0.8192")]

    def run(n):
        F, ends = None, centres[1:] + [Decimal(1)]
        for c, e in zip(centres, ends):
            a, b = 1 + 3 * c, 1 + 2 * c                 # Taylor coefficients of the right-hand side about c
            h = [3 * Decimal(-3) ** j / a ** (j + 1) - 2 * Decimal(-2) ** j / b ** (j + 1) for j in range(n + 1)]
            if c == 0:
                f = [h[j] / (j + 1) for j in range(n + 1)]
            else:
                f = [F]
                for j in range(n):
                    f.append((h[j] - (j + 1) * f[j]) / (c * (j + 1)))
            F = sum(f[j] * (e - c) ** j for j in range(n + 1))
        return F

    orders = [4, 6, 8, 10, 12, 15, 18, 22, 26, 30, 35, 40, 46, 52, 60, 70, 80, 90, 100, 110, 120, 130]
    runs = [[n, format(run(n), "f")[:34]] for n in orders]
    return dict(exact=format((Decimal(4) / 3).ln(), "f")[:34], runs=runs)


def tour_scene_data():
    """References for the paper tour on the Research page, taken from PUBS, and the digits
    for the high-precision vignette."""
    refs = {}
    for p in PUBS:                                # each caption opens its paper, with the abstract, on the Publications page
        key = p.get("arxiv") or p.get("doi") or (f"inspire:{p['inspire']}" if p.get("inspire") else p["title"])
        refs[key] = dict(r=_plain(p["ref"]), u=f"publications.html#{_pub_id(p)}")
    return dict(refs=refs, hp=_precision_digits())


def funding_scene_data():
    import re
    short = {"Alexander von Humboldt Foundation": "AvH", "University of Zürich": "UZH",
             "Ministry of Human Resource Development": "MHRD"}
    awards = []
    for year, name, agency, country, amount, dur, status in FUNDING:
        m = re.search(r"\(([A-Z]+)\)", agency)
        usd = int(re.search(r"\$([\d,]+)", amount).group(1).replace(",", ""))   # the approximate amount in US dollars
        awards.append(dict(y=int(year), n=name, a=re.sub(r"\s*\([A-Z]+\)", "", agency), s=m.group(1) if m else short.get(agency, agency),
                           c=country, amt=amount.split(" (")[0], usd=usd, d=dur, st=status.lower()))
    return dict(awards=sorted(awards, key=lambda a: (a["y"], a["usd"])))


def teaching_scene_data():
    return dict(courses=[dict(y=int(y), c=course, i=inst) for y, course, role, inst, desc in TEACHING])


def supervision_scene_data():
    return dict(students=[dict(y=int(y), n=name, l=lvl, i=inst, th=thesis)
                          for y, name, lvl, inst, thesis in sorted(SUPERVISION, key=lambda x: int(x[0]))])


def cv_scene_data():
    import re
    months = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}
    tags = {"BSc in Physics": "BSc", "MS in Physics": "MS", "PhD in High Energy Physics": "PhD",
            "Postdoctoral Researcher": "Postdoc"}
    stages = []
    for item in EDUCATION + EMPLOYMENT:
        dates = re.findall(r"([A-Z][a-z]{2}) (\d{4})", item["when"])
        start = int(dates[0][1]) + months[dates[0][0]] / 12
        end = int(dates[1][1]) + (months[dates[1][0]] + 1) / 12 if len(dates) > 1 else None
        org = _plain(item["org"])
        for long_name, short_name in (("Centre for High Energy Physics, ", ""), ("Department of Physical Sciences, ", ""),
                                      ("SLAC National Accelerator Laboratory", "SLAC"), ("Paul Scherrer Institut", "PSI"),
                                      (" & ", " and ")):
            org = org.replace(long_name, short_name)
        short_org = {"Indian Institute of Science": "IISc", "University of Zürich and PSI": "UZH and PSI",
                     "SLAC and Stanford University": "SLAC and Stanford"}.get(org, org)
        stages.append(dict(t=tags.get(item["title"], item["title"]), title=item["title"], o=org, os=short_org, w=item["when"],
                           c=item["where"].split(",")[0], s=round(start, 3), e=round(end, 3) if end else None,
                           k="edu" if item in EDUCATION else "job"))
    stages.sort(key=lambda x: x["s"])
    now = date.today()
    return dict(stages=stages, now=round(now.year + (now.month - 0.5) / 12, 3))


def globe_scene_data():
    """Land outlines in longitude and latitude (Natural Earth 1:110m), simplified, for the globe."""
    import importlib.util
    import json
    spec = importlib.util.spec_from_file_location("make_world_dots", "tools/make_world_dots.py")
    mw = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mw)
    rings = []
    for ring in mw.decode_rings(json.loads(Path("tools/land-110m.json").read_text())):
        if max(lat for _, lat in ring) < -55:          # leave out Antarctica
            continue
        simple = mw.simplify_ring(ring, 0.35)
        if len(simple) < 4:
            continue
        rings.append([v for lon, lat in simple for v in (round(lon * 10), round(lat * 10))])
    return dict(land=rings)


def page_scenes():
    """The animation in the header of each inner page: (scene, caption, hint, data)."""
    years = [int(p["year"]) for p in PUBS]
    cities = {t[2] for t in TALKS}
    first_talk = min(int(t[0]) for t in TALKS)
    return {
        "research.html": ("tour", "A tour of my papers", "Click or use the arrow keys for the next paper", tour_scene_data),
        "publications.html": ("constellation", f"{len(PUBS)} publications from {min(years)} to {max(years)}",
                              "Hover over a star, click to open the paper", pub_scene_data),
        "talks.html": ("talkmap", f"{len(TALKS)} talks in {len(cities)} cities since {first_talk}",
                       "Click a city for its talks. Hollow dots are online.", talk_scene_data),
        "funding.html": ("medals", f"{len(FUNDING)} fellowships and grants since {min(int(f[0]) for f in FUNDING)}",
                         "Click or use the arrow keys for the next award", funding_scene_data),
        "software.html": ("toolchain", "From Feynman integrals to numbers", "Click a package to open it", toolchain_scene_data),
        "teaching.html": ("chalkboard", "From the blackboard", "Click or use the arrow keys for the next equation", teaching_scene_data),
        "supervision.html": ("mentoring", f"{len(SUPERVISION)} students since {min(int(x[0]) for x in SUPERVISION)}",
                             "Click or use the arrow keys for the next student", supervision_scene_data),
        "cv.html": ("timeline", "From Kolkata to Stanford", "Click or use the arrow keys for the next stage", cv_scene_data),
        "contact.html": ("globe", "SLAC, Menlo Park, California", "Drag to turn the globe", globe_scene_data),
    }


def render_journey_map():
    import json
    m = json.loads(Path("assets/map/world-dots.json").read_text())
    x_min, _ = _natural_earth(-180, 0)
    x_max, _ = _natural_earth(180, 0)
    _, y_top = _natural_earth(0, m["lat_top"])
    scale = m["width"] / (x_max - x_min)

    def project(lat, lon):
        x, y = _natural_earth(lon, lat)
        return round((x - x_min) * scale, 1), round((y_top - y) * scale, 1)

    pts = [project(lat, lon) for lat, lon, _ in JOURNEY_GEO]
    arcs, route = [], f"M{pts[0][0]} {pts[0][1]}"
    for i in range(len(pts) - 1):
        (x1, y1), (x2, y2) = pts[i], pts[i + 1]
        dx, dy = x2 - x1, y2 - y1
        dist = (dx * dx + dy * dy) ** 0.5
        nx, ny = -dy / dist, dx / dist                 # unit normal
        if ny > 0:
            nx, ny = -nx, -ny                          # bow the arc upwards (north)
        lift = dist * (0.42 if dist < 120 else 0.24)
        cx, cy = round((x1 + x2) / 2 + nx * lift, 1), round((y1 + y2) / 2 + ny * lift, 1)
        seg = f"M{x1} {y1}Q{cx} {cy} {x2} {y2}"
        route += f"Q{cx} {cy} {x2} {y2}"
        delay = 0.9 + i * 1.3
        arcs.append(f'<path class="jm-glow" pathLength="1" style="--a:{delay}s" d="{seg}"/>'
                    f'<path class="jm-arc" pathLength="1" style="--a:{delay}s" d="{seg}"/>')

    cities = []
    last = len(pts) - 1
    for k, ((x, y), (year, city, *_), (_, _, (ldx, ldy, anchor))) in enumerate(zip(pts, JOURNEY, JOURNEY_GEO)):
        delay = 0.5 if k == 0 else 2.0 + 1.3 * (k - 1) - 0.15
        now = " now" if k == last else ""
        ping = '<circle class="jm-ping" r="7"/>' if k == last else ""
        cities.append(
            f'<g transform="translate({x} {y})"><g class="jm-city{now}" style="--c:{delay:.2f}s">'
            f'{ping}<circle class="jm-halo" r="11"/><circle class="jm-dot" r="5"/>'
            f'<text class="jm-name" x="{ldx}" y="{ldy}" text-anchor="{anchor}">{city}</text>'
            f'<text class="jm-year" x="{ldx}" y="{ldy + 15}" text-anchor="{anchor}">{year}</text>'
            f'</g></g>')

    VIEW = "96 16 930 344"          # crop: the Americas to East Asia, Arctic to the tropics of Capricorn
    label = ", ".join(f"{c} {y}" for y, c, *_ in JOURNEY)
    return (f'<figure class="journey-map" data-hold="5600">'
            f'<svg viewBox="{VIEW}" role="img" aria-label="Academic journey: {label}">'
            f'<path class="jm-grat" d="{m["graticule"]}"/>'
            f'<path class="jm-land" d="{m["land"]}"/>'
            f'<path id="jm-route" class="jm-route" d="{route}"/>'
            f'<g class="jm-arcs">{"".join(arcs)}</g>'
            f'<g class="jm-cities">{"".join(cities)}</g>'
            f'<circle class="jm-traveler" r="4.5"/>'
            f'</svg></figure>')


def render_ticker():
    return "".join(f'<span>{w}</span><i>✦</i>' for w in TICKER)


NEWS_ICONS = {
    "paper": _p("M13 2H29L35 8V28H13Z") + _p("M29 2V8H35M17 13H31M17 17H31M17 21H27", "thin"),
    "proc": _p("M11 6H29V28H11Z") + _p("M16 2H34V24M15 12H25M15 16H25M15 20H22", "thin"),
    "talk": _p("M7 3H41V20H7Z") + _p("M24 20V27M16 27H32M11 15Q17 6 23 11T37 7", "thin"),
    "join": _p("M24 28C24 28 14 18 14 11A10 10 0 1 1 34 11C34 18 24 28 24 28Z") + _p("M24 7.5A3.5 3.5 0 1 1 23.9 7.5Z", "thin"),
    "award": _p("M19 19L16 29L20 27L21 30M29 19L32 29L28 27L27 30", "thin") + _p("M24 2A9 9 0 1 1 23.9 2Z") + _p("M24 5.5A5.5 5.5 0 1 1 23.9 5.5Z", "thin"),
}


def _news_kind(text):
    low = text.lower()
    for kind, words in (("talk", ("talk", "seminar")), ("award", ("awarded", "fellowship")),
                        ("join", ("joined", "moved")), ("paper", ("published", "appeared", "arxiv"))):
        if any(w in low for w in words):
            return kind
    return "paper"


def render_news():
    return "\n".join(f'<li><span class="when">{y}</span>{_ix(NEWS_ICONS[_news_kind(txt)])}'
                     f'<a class="news-link" href="{href}">{txt}&nbsp;<span class="nl-go" aria-hidden="true">→</span></a></li>'
                     for y, txt, href in ((y, t, _talk_link(h[5:]) if h.startswith("talk:") else h) for y, t, h in NEWS))


def render_selected():
    return "\n".join(
        f'<a class="pick {topic}" href="{_pub_link(arx)}">'      # to the paper, opened, on the Publications page
        f'{_ix(PAPER_ICONS[arx]) if arx in PAPER_ICONS else ""}'
        f'<span class="kicker">{TOPIC_LABEL[topic]}</span>'
        f'<span class="pick-title">{title}</span>'
        f'<span class="pick-text">{pitch}</span>'
        f'<span class="pick-ref">{ref} <span aria-hidden="true">→</span></span></a>'
        for topic, title, ref, arx, pitch in SELECTED)


# Research: one Mellin-Barnes integral and its two series, the example of the tour's slide "What is a Mellin-Barnes
# integral?". Closing the contour to the right sums the poles of Γ(−z) into a series in x, which converges for
# |x| <= 1 (its radius is set by the branch point of (1 - x)^(1/2) at x = 1). Closing it to the left sums the
# poles of Γ(−1/2 + z) into a series in 1/x, which converges for |x| >= 1. Both are −2√π (1 − x)^(1/2), and on the
# real line they meet at x = −1, where they are the same series term by term. A slider sets the number of terms.
def render_continuation():
    g = '<span class="g">Γ</span>'
    half = '<span class="fr">½</span>'
    right = (f'Σ<sub><i>n</i></sub> {g}(<i>n</i> − {half}) <i>x</i><sup><i>n</i></sup>/<i>n</i>!')
    left = (f'(−<i>x</i>)<sup>{half}</sup> Σ<sub><i>n</i></sub> {g}(<i>n</i> − {half}) <i>x</i><sup>−<i>n</i></sup>/<i>n</i>!')
    func = f'−2√π (1 − <i>x</i>)<sup>{half}</sup>'
    return (
        '<figure class="cont" aria-labelledby="cont-cap">\n'
        '<p class="cont-lede">Closing the contour of a Mellin-Barnes integral to the right or to the left picks up different poles, '
        'and gives a different series for the same function. Each series converges in a region of its own, and each is the '
        'analytic continuation of the other. Here is the integral of the slide '
        '<a href="#tour-2402.04174">What is a Mellin-Barnes integral?</a> in the tour above, with the number of terms on a slider.</p>\n'
        f'<p class="cont-eq"><span><i>I</i>(<i>x</i>) = ∫ d<i>z</i>/2π<i>i</i> (−<i>x</i>)<sup><i>z</i></sup> '
        f'{g}(−<i>z</i>) {g}(−{half} + <i>z</i>)</span> <span>= {func}</span></p>\n'
        '<div class="cont-box"><canvas class="cont-plot" role="img" aria-label="The function and the two series for x from −4 to 1. '
        'The series in x settles onto the function for |x| ≤ 1 and breaks away below x = −1, where the series in 1/x settles onto it instead."></canvas></div>\n'
        '<p class="cont-read" aria-hidden="true"></p>\n'
        '<div class="cont-ctl"><label for="cont-n">Terms in each series</label>'
        '<input class="cont-range" id="cont-n" type="range" min="1" max="40" step="1" value="30">'
        '<output class="cont-n" for="cont-n" aria-live="off">30</output>'
        '<button class="cont-play" type="button">Play again</button></div>\n'
        '<ul class="cont-key">'
        f'<li class="k-r"><span class="sw" aria-hidden="true"></span><span>Closing to the right, on the poles of {g}(−<i>z</i>): '
        f'<span class="nw">{right}</span>, which converges for |<i>x</i>| ≤ 1</span></li>'
        f'<li class="k-l"><span class="sw" aria-hidden="true"></span><span>Closing to the left, on the poles of {g}(−{half} + <i>z</i>): '
        f'<span class="nw">{left}</span>, which converges for |<i>x</i>| ≥ 1</span></li>'
        f'<li class="k-f"><span class="sw" aria-hidden="true"></span><span>The function itself, <span class="nw">{func}</span></span></li>'
        '</ul>\n'
        '<figcaption id="cont-cap">The radius of the series in <i>x</i> is set by the branch point of '
        f'(1 − <i>x</i>)<sup>{half}</sup> at <i>x</i> = 1. On the real line the two regions meet at <i>x</i> = −1, where the two '
        'series are the same series term by term. With more integration variables there are many more ways to close the '
        'contours. The two-fold integral of the Appell function <i>F</i><sub>1</sub> already has five series representations, '
        'whose regions of convergence tile the plane of |<i>u</i><sub>1</sub>| and |<i>u</i><sub>2</sub>| '
        f'(<a href="{_pub_link("2012.15108")}">Phys. Rev. Lett. 127, 151601</a>), and the nine-fold integral of the conformal '
        f'hexagon has 194160 (<a href="{_pub_link("2309.00409")}">Phys. Rev. D 110, 036002</a>). '
        '<a href="software.html#mbconichulls">MBConicHulls</a> derives them automatically.</figcaption>\n'
        '</figure>\n' + CONT_JS)


PMAP_JS = r"""<script>
(function () {
  'use strict';
  var fig = document.querySelector('.pmap'), cv = fig && fig.querySelector('.pmap-plot'), src = fig && fig.querySelector('.pmap-data');
  if (!cv || !cv.getContext || !src) return;
  var P = []; try { P = JSON.parse(src.textContent); } catch (e) { return; }
  var ctx = cv.getContext('2d'), read = fig.querySelector('.pmap-read');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches, touch = window.matchMedia('(hover: none)').matches;
  var INKS = {
    light: { fi: '122,95,42', ph: '46,92,78', b: '168,137,79', s: '74,90,102', p: '249,247,241', g: '28,53,47' },
    dark:  { fi: '214,180,110', ph: '127,184,163', b: '201,168,104', s: '170,182,186', p: '17,28,24', g: '232,226,208' }
  };
  var C = INKS.light;
  function palette() { C = INKS[document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light']; }
  function ink(k, a) { return 'rgba(' + C[k] + ',' + a + ')'; }
  var W = 0, H = 0, dpr = 1, pos = [], hov = -1, tapped = -1, t0 = null, raf = null,
      played = reduce || document.documentElement.classList.contains('still');
  var M = { l: 26, r: 26, t: 20, b: 34 };
  function layout() {                              // the scaled places, then nudged apart so that no two dots overlap
    var w = W - M.l - M.r, h = H - M.t - M.b, min = Math.max(11, Math.min(16, w / 46));
    var home = P.map(function (q) { return [M.l + q.x * w, M.t + (1 - q.y) * h]; });
    pos = home.map(function (a) { return [a[0], a[1]]; });
    for (var it = 0; it < 160; it++) {
      for (var i = 0; i < pos.length; i++) for (var j = i + 1; j < pos.length; j++) {
        var dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1], d = Math.hypot(dx, dy) || 0.01;
        if (d < min) { var f = (min - d) / d / 2; pos[i][0] -= dx * f; pos[i][1] -= dy * f; pos[j][0] += dx * f; pos[j][1] += dy * f; }
      }
      pos.forEach(function (a, i) {                  // and pulled back towards where they belong, inside the frame
        a[0] += (home[i][0] - a[0]) * 0.04; a[1] += (home[i][1] - a[1]) * 0.04;
        a[0] = Math.max(M.l, Math.min(W - M.r, a[0])); a[1] = Math.max(M.t, Math.min(H - M.b, a[1]));
      });
    }
  }
  function size() {
    W = cv.clientWidth; H = cv.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (W) { layout(); draw(); }
  }
  function ease(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return 1 - Math.pow(1 - x, 3); }
  function where(i, u) {                           // during the opening the dots come out of the middle, oldest first
    var k = ease(u * 1.8 - i / P.length * 0.8), a = pos[i];
    return [W / 2 + (a[0] - W / 2) * k, H / 2 + (a[1] - H / 2) * k, k];
  }
  function draw() {
    if (!W) return;
    var u = played && t0 === null ? 1 : t0 === null ? 0 : Math.min(1, (performance.now() - t0) / 1800);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.font = '600 9px Inter, system-ui, sans-serif'; ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '1.2px';
    ctx.fillStyle = ink('s', 0.85);
    ctx.textAlign = 'left'; ctx.fillText('NEW HIGGS BOSONS', M.l - 8, H - 10);
    ctx.textAlign = 'right'; ctx.fillText('FEYNMAN INTEGRALS', W - M.r + 8, H - 10);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.strokeStyle = ink('b', 0.35); ctx.lineWidth = 1;   // the arrow between the two ends
    var y0 = H - 13, xa = M.l + 108, xb = W - M.r - 116;
    if (xb > xa + 30) { ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xb, y0); ctx.moveTo(xa + 5, y0 - 3); ctx.lineTo(xa, y0); ctx.lineTo(xa + 5, y0 + 3);
                         ctx.moveTo(xb - 5, y0 - 3); ctx.lineTo(xb, y0); ctx.lineTo(xb - 5, y0 + 3); ctx.stroke(); }
    var lk = ease((u - 0.55) / 0.45), at = P.map(function (q, i) { return where(i, u); });
    if (lk > 0) {                                  // each paper joined to the three closest to it
      ctx.lineWidth = 1;
      P.forEach(function (q, i) {
        q.e.forEach(function (j) {
          if (j < i && P[j].e.indexOf(i) >= 0) return;    // a pair joined both ways is drawn once
          var on = hov >= 0 && (i === hov || j === hov);
          ctx.strokeStyle = ink('b', (on ? 0.85 : hov >= 0 ? 0.08 : 0.2) * lk);
          ctx.lineWidth = on ? 1.4 : 1;
          ctx.beginPath(); ctx.moveTo(at[i][0], at[i][1]); ctx.lineTo(at[j][0], at[j][1]); ctx.stroke();
        });
      });
    }
    P.forEach(function (q, i) {
      var a = at[i], col = q.t === 'pheno' ? 'ph' : 'fi', near = hov >= 0 && (i === hov || P[hov].e.indexOf(i) >= 0 || q.e.indexOf(hov) >= 0);
      var al = (hov >= 0 && !near ? 0.35 : 1) * a[2], r = q.k === 'proceedings' ? 3.4 : 4.2;
      if (al <= 0) return;
      ctx.beginPath(); ctx.arc(a[0], a[1], r, 0, 2 * Math.PI);
      if (q.k === 'proceedings') { ctx.fillStyle = ink('p', al); ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = ink(col, 0.95 * al); ctx.stroke(); }
      else { ctx.fillStyle = ink(col, 0.95 * al); ctx.fill(); }
      if (q.k === 'thesis') { ctx.lineWidth = 1; ctx.strokeStyle = ink(col, 0.8 * al); ctx.beginPath(); ctx.arc(a[0], a[1], r + 3, 0, 2 * Math.PI); ctx.stroke(); }
      if (i === hov) { ctx.lineWidth = 1.3; ctx.strokeStyle = ink('b', 1); ctx.beginPath(); ctx.arc(a[0], a[1], r + 5, 0, 2 * Math.PI); ctx.stroke(); }
    });
    if (u < 1) raf = requestAnimationFrame(draw); else { raf = null; t0 = null; played = true; }
  }
  function say() {
    if (!read) return;
    if (hov < 0) { read.textContent = touch ? 'Tap a dot to read its title, tap it again to open the paper' : 'Point at a dot to read its title, click to open the paper'; read.classList.remove('on'); return; }
    var q = P[hov];
    read.innerHTML = '<span class="pr-y">' + q.yr + '</span> <span class="pr-n"></span> <span class="pr-r"></span>';
    read.querySelector('.pr-n').textContent = q.n; read.querySelector('.pr-r').textContent = q.r;
    read.classList.add('on');
  }
  function pick(ev) {
    var r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, best = -1, bd = 14;
    pos.forEach(function (a, i) { var d = Math.hypot(a[0] - x, a[1] - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  cv.addEventListener('mousemove', function (ev) {
    if (!played) return;
    var h = pick(ev);
    if (h !== hov) { hov = h; cv.style.cursor = h >= 0 ? 'pointer' : ''; draw(); say(); }
  });
  cv.addEventListener('mouseleave', function () { if (hov >= 0) { hov = -1; draw(); say(); } });
  cv.addEventListener('click', function (ev) {
    var h = pick(ev);
    if (h < 0) { if (hov >= 0) { hov = -1; tapped = -1; draw(); say(); } return; }
    if (touch && tapped !== h) { tapped = h; hov = h; draw(); say(); return; }   // on a touch screen the first tap names it
    location.href = P[h].u;
  });
  document.addEventListener('themechange', function () { palette(); draw(); });
  palette(); say();
  if (window.ResizeObserver) new ResizeObserver(size).observe(cv); else { window.addEventListener('resize', size); size(); }
  if (!played && window.IntersectionObserver) {      // the dots come out once, when the map comes into view
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); t0 = performance.now(); if (!raf) raf = requestAnimationFrame(draw); }
    }, { threshold: 0.4 });
    io.observe(cv);
  } else played = true;
})();
</script>"""


CONT_JS = r"""<script>
(function () {
  'use strict';
  var fig = document.querySelector('.cont'), cv = fig && fig.querySelector('.cont-plot');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), box = fig.querySelector('.cont-box'), rng = fig.querySelector('.cont-range'),
      out = fig.querySelector('.cont-n'), read = fig.querySelector('.cont-read'), again = fig.querySelector('.cont-play');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      touch = window.matchMedia('(hover: none)').matches;
  var INKS = {                                       // the inks of the page scenes, by day and by night
    light: { f: '28,53,47', r: '110,44,52', l: '46,92,78', b: '168,137,79', s: '74,90,102', p: '249,247,241' },
    dark:  { f: '232,226,208', r: '216,132,142', l: '127,184,163', b: '201,168,104', s: '170,182,186', p: '17,28,24' }
  };
  var C = INKS.light;
  function palette() { C = INKS[document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light']; }
  function ink(k, a) { return 'rgba(' + C[k] + ',' + a + ')'; }

  // the coefficients c_n = Γ(n − 1/2)/n!, from Γ(−1/2) = −2√π and c_n = c_(n−1) (n − 3/2)/n
  var NMAX = 40, SQPI = Math.sqrt(Math.PI), co = [-2 * SQPI];
  for (var k = 1; k <= NMAX; k++) co.push(co[k - 1] * (k - 1.5) / k);
  function fn(x) { return -2 * SQPI * Math.sqrt(1 - x); }
  function partial(u, N) {                         // c_0 + c_1 u + ... with N terms (while the slider moves, the next one comes in gradually)
    var s = 0, p = 1, m = Math.floor(N), f = N - m;
    for (var i = 0; i < m; i++) { s += co[i] * p; p *= u; }
    return s + (f > 0 ? f * co[m] * p : 0);
  }
  function right(x, N) { return partial(x, N); }                   // closing to the right: the series in x
  function left(x, N) { return Math.sqrt(-x) * partial(1 / x, N); }  // closing to the left: the series in 1/x (x < 0 on the real line)

  var X0 = -4, X1 = 1, Y0 = -9, Y1 = 1.2, W = 0, H = 0, dpr = 1, P = { l: 34, r: 10, t: 12, b: 24 };
  var stillAtLoad = document.documentElement.classList.contains('still');   // the animations paused with the button
  var N = reduce || stillAtLoad ? 30 : 1, hx = null, played = reduce || stillAtLoad, raf = null, focus = null;
  function PX(x) { return P.l + (x - X0) / (X1 - X0) * (W - P.l - P.r); }
  function PY(y) { return P.t + (Y1 - y) / (Y1 - Y0) * (H - P.t - P.b); }
  function XP(px) { return X0 + (px - P.l) / (W - P.l - P.r) * (X1 - X0); }
  function size() {
    W = cv.clientWidth; H = cv.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    draw();
  }
  function curve(f, from, to, col, lw) {          // one value per pixel, kept within reach of the frame
    var lo = PY(Y0) + 60, hi = PY(Y1) - 60, on = false;
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (var px = Math.ceil(PX(from)), end = PX(to); px <= end + 0.5; px++) {
      var y = f(Math.min(XP(px), to)), py = PY(y);
      if (y !== y) { on = false; continue; }
      py = py > lo ? lo : py < hi ? hi : py;
      if (on) ctx.lineTo(px, py); else { ctx.moveTo(px, py); on = true; }
    }
    ctx.stroke();
  }
  function label(t, x, y, col, align, size, italic) {
    ctx.font = (italic ? 'italic ' : '') + (italic ? 400 : 500) + ' ' + (size || 10) + 'px ' + (italic ? '"Source Serif 4", Georgia, serif' : 'Inter, system-ui, sans-serif');
    ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.fillText(t, x, y);
  }
  function draw() {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    var l = P.l, r = W - P.r, t = P.t, b = H - P.b, m1 = PX(-1);
    ctx.fillStyle = ink('l', 0.06); ctx.fillRect(l, t, m1 - l, b - t);        // where each series converges
    ctx.fillStyle = ink('r', 0.05); ctx.fillRect(m1, t, r - m1, b - t);
    ctx.textBaseline = 'alphabetic';
    label('|x| ≥ 1', (l + m1) / 2, b - 8, ink('l', 0.9), 'center', 12, true);
    label('|x| ≤ 1', (m1 + r) / 2, b - 8, ink('r', 0.9), 'center', 12, true);
    ctx.strokeStyle = ink('f', 0.12); ctx.lineWidth = 1;                       // the grid, the axis and the ticks
    for (var g = -8; g <= 0; g += 2) { ctx.beginPath(); ctx.moveTo(l, PY(g)); ctx.lineTo(r, PY(g)); ctx.stroke(); }
    ctx.strokeStyle = ink('f', 0.45); ctx.beginPath(); ctx.moveTo(l, b); ctx.lineTo(r, b); ctx.stroke();
    for (var x = X0; x <= X1; x++) {
      ctx.beginPath(); ctx.moveTo(PX(x), b); ctx.lineTo(PX(x), b + 4); ctx.stroke();
      label(String(x).replace('-', '−'), PX(x), b + 15, ink('s', 0.95), 'center');
    }
    for (g = -8; g <= 0; g += 2) { ctx.textBaseline = 'middle'; label(String(g).replace('-', '−'), l - 7, PY(g), ink('s', 0.95), 'right'); }
    ctx.textBaseline = 'alphabetic';
    label('x', r, b - 6 - 14, ink('s', 0.9), 'right', 12, true);
    ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = ink('b', 0.8); ctx.beginPath(); ctx.moveTo(m1, t); ctx.lineTo(m1, b); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(l, t - 2, r - l + 2, b - t + 2); ctx.clip();
    function A(k, a) { return focus && focus !== k ? a * 0.22 : a; }               // a line of the key, pointed at, stands out
    function L(k, w) { return focus === k ? w + 0.7 : w; }
    curve(fn, X0, X1, ink('f', A('f', 0.14)), 6); curve(fn, X0, X1, ink('f', A('f', 0.85)), L('f', 1.3));   // the function
    curve(function (x) { return right(x, N); }, X0, -1, ink('r', A('r', 0.4)), L('r', 1.6));        // each series, strong where it converges
    curve(function (x) { return left(x, N); }, -1, -0.01, ink('l', A('l', 0.4)), L('l', 1.6));
    curve(function (x) { return right(x, N); }, -1, X1, ink('r', A('r', 0.95)), L('r', 1.9));
    curve(function (x) { return left(x, N); }, X0, -1, ink('l', A('l', 0.95)), L('l', 1.9));
    ctx.restore();
    ctx.strokeStyle = ink('f', 0.85); ctx.lineWidth = 1.2; ctx.fillStyle = ink('p', 1);   // the branch point at x = 1, an open circle
    ctx.beginPath(); ctx.arc(PX(1), PY(0), 3.4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    label('branch point', PX(1) - 7, PY(0) + 3.5, ink('s', 0.9), 'right', 9.5);
    if (hx !== null) {                               // the place being read
      var px = PX(hx);
      ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = ink('b', 0.9); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, t); ctx.lineTo(px, b); ctx.stroke(); ctx.restore();
      [[fn(hx), 'f'], [Math.abs(hx) <= 1 ? right(hx, N) : NaN, 'r'], [hx <= -1 ? left(hx, N) : NaN, 'l']].forEach(function (q) {
        var py = PY(q[0]);
        if (q[0] === q[0] && py > t && py < b) { ctx.fillStyle = ink(q[1], 1); ctx.beginPath(); ctx.arc(px, py, 3, 0, 2 * Math.PI); ctx.fill(); }
      });
    }
  }
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function num(v) { return v.toFixed(4).replace('-', '−'); }
  function off(e) {                                  // how far a partial sum is from the function
    if (e >= 0.001) return e.toFixed(e >= 0.1 ? 2 : 3);
    if (e < 1e-15) return '0';
    var p = Math.floor(Math.log(e) / Math.LN10), m = e / Math.pow(10, p);
    if (m >= 9.95) { m = 1; p++; }
    return m.toFixed(1) + ' × 10' + String(p).replace(/./g, function (c) { return SUP[c]; });
  }
  function readout() {
    if (!read) return;
    if (hx === null) { read.innerHTML = '<span class="cr-hint">' + (touch ? 'Touch' : 'Point at') + ' the plot to read the values</span>'; return; }
    var f = fn(hx), parts = ['<span class="cr-x"><i>x</i> = ' + num(hx).slice(0, -2) + '</span>', '<span class="cr-f">function ' + num(f) + '</span>'];
    [['r', Math.abs(hx) <= 1 ? right(hx, Math.round(N)) : null, 'series in <i>x</i>'],
     ['l', hx <= -1 ? left(hx, Math.round(N)) : null, 'series in 1/<i>x</i>']].forEach(function (q) {
      parts.push('<span class="cr-' + q[0] + '">' + q[2] + ' ' + (q[1] === null ? 'diverges here' : num(q[1]) + ' <span class="cr-off">off by ' + off(Math.abs(q[1] - f)) + '</span>') + '</span>');
    });
    read.innerHTML = parts.join('');
  }
  function show(n) { var k = Math.round(n); if (+rng.value !== k) rng.value = k; out.textContent = k; }
  function play() {                                  // the terms come in one after another, the first ones slowly
    if (raf) cancelAnimationFrame(raf);
    played = true; var t0 = null, T = 8;
    function step(now) {
      if (t0 === null) t0 = now;
      var u = Math.min(1, (now - t0) / 1000 / T);
      N = 1 + 29 * Math.pow(u, 1.8); show(N); draw(); readout();
      raf = u < 1 ? requestAnimationFrame(step) : null;
    }
    raf = requestAnimationFrame(step);
  }
  rng.addEventListener('input', function () {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    played = true; N = +rng.value; show(N); draw(); readout();
  });
  if (again && reduce) again.hidden = true;           // without motion the terms are all there at once
  else if (again) again.addEventListener('click', function () { N = 1; show(N); play(); });
  function at(ev) {
    var r = cv.getBoundingClientRect(), x = XP(ev.clientX - r.left);
    hx = x < X0 || x > X1 ? null : Math.round(x * 100) / 100; draw(); readout();
  }
  var key = fig.querySelector('.cont-key');
  Array.prototype.forEach.call(key ? key.children : [], function (li) {   // the key names its line in the plot
    var k = li.className.slice(2, 3);
    li.addEventListener('mouseenter', function () { focus = k; key.classList.add('focus'); li.classList.add('on'); draw(); });
    li.addEventListener('mouseleave', function () { focus = null; key.classList.remove('focus'); li.classList.remove('on'); draw(); });
  });
  cv.addEventListener('pointermove', at);
  cv.addEventListener('pointerdown', at);
  cv.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse') { hx = null; draw(); readout(); } });
  document.addEventListener('themechange', function () { palette(); draw(); });
  palette(); show(N); readout();
  if (window.ResizeObserver) new ResizeObserver(size).observe(box); else { window.addEventListener('resize', size); size(); }
  if (!played && window.IntersectionObserver) {      // it plays once, when it comes into view
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); if (!played) play(); }
    }, { threshold: 0.45 });
    io.observe(box);
  } else if (!played) { N = 30; show(N); }
})();
</script>"""


def talk_row(year, event, city, title, note):
    note_html = f'<div class="meta">{note}</div>' if note else ""
    return (f'<div class="entry"><div class="rail">{year}</div><div class="body">'
            f'<span class="where">{city}</span>'
            f'<span class="title">“{title}”</span>'
            f'<div class="detail">{event}</div>{note_html}</div></div>')


TALK_ICONS = {
    "seminar": _p("M7 3H41V20H7Z") + _p("M24 20V27M16 27H32M11 15Q17 6 23 11T37 7", "thin"),
    "meeting": _p("M10 12A3 3 0 1 1 9.9 12ZM24 8.5A3.5 3.5 0 1 1 23.9 8.5ZM38 12A3 3 0 1 1 37.9 12Z")
               + _p("M4 27C4 20 16 20 16 27M17 27C17 18 31 18 31 27M32 27C32 20 44 20 44 27", "thin"),
    "school": _p("M24 7C18 3 9 3 4 6V26C9 23 18 23 24 27C30 23 39 23 44 26V6C39 3 30 3 24 7Z") + _p("M24 7V27", "thin"),
    "online": _p("M17 10A10 10 0 0 0 17 24M31 10A10 10 0 0 1 31 24M11 5A17 17 0 0 0 11 29M37 5A17 17 0 0 1 37 29", "thin") + _dots([(24, 17)], 2.4),
}


def _talk_kind(event):
    low = event.lower()
    if "online" in low:
        return "online"
    if "school" in low:
        return "school"
    if any(w in low for w in ("seminar", "journal club", "lunch")):
        return "seminar"
    return "meeting"


def _talk_ids():
    """An anchor for each talk: the year and the first words of the meeting, numbered if they repeat."""
    import html as _html
    seen, out = set(), []
    for t in TALKS:
        base = f"talk-{t[0]}-" + "-".join(_slug(_html.unescape(t[1])).split("-")[:4])
        tid, k = base, 2
        while tid in seen:
            tid, k = f"{base}-{k}", k + 1
        seen.add(tid)
        out.append(tid)
    return out


def _talk_link(words):
    """The link to the first talk whose meeting names these words, for the news on the home page."""
    return "talks.html#" + next(tid for tid, t in zip(_talk_ids(), TALKS) if words in t[1])


def render_talks():
    cards, ids = [], _talk_ids()
    for k, (year, event, city, title, note, invited) in enumerate(TALKS[:TALK_CARDS]):
        note_html = f'<div class="tc-note">{note}</div>' if note else ""
        kind = _talk_kind(event)
        cards.append(
            f'<article class="talk-card" id="{ids[k]}" data-city="{city}" data-inv="{int(invited)}"><div class="tc-top"><span>{_ix(TALK_ICONS[kind], "ix tc-ix")}{year}</span><span>{city}</span></div>'
            f'<h4 class="tc-title">“{title}”</h4><div class="tc-event">{event}</div>{note_html}</article>')
    rest = [talk_row(y, ev, c, ti, no).replace('<div class="entry">', f'<div class="entry" id="{ids[TALK_CARDS + i]}" data-city="{c}" data-inv="{int(inv)}" style="--i:{i}">', 1)
            for i, (y, ev, c, ti, no, inv) in enumerate(TALKS[TALK_CARDS:])]
    chip = ('<p class="dom-chip talk-chip" hidden><span class="dc-l">Talks in</span><b class="dc-n"></b><span class="tf-n"></span>'
            '<button class="dc-x" type="button" aria-label="Show the talks in every city" title="Show every city">×</button></p>')
    invited = sum(t[5] for t in TALKS)
    tools = (f'<p class="talk-tools"><button class="talk-inv" type="button" aria-pressed="false">Invited talks only'
             f'<span class="ca-n">{invited}</span></button></p>')
    out = tools + chip + '<div class="talk-cards">' + "\n".join(cards) + '</div>'
    if rest:
        out += (f'\n<details class="more" id="earlier-talks"><summary>Show {len(rest)} earlier talks</summary>\n'
                + "\n".join(rest) + "\n</details>")
    return out


def _proposal_html(name):
    """The research proposal of a fellowship, folded under its card: the title and the abstract, as in the application."""
    pr = FUND_PROPOSALS.get(name)
    if not pr:
        return ""
    body = ""
    for part in pr["abstract"]:
        if isinstance(part, dict):
            body += '<ol class="fund-wps">' + "".join(f'<li><span class="wp-n">{n}.</span> {t}</li>' for n, t in part["list"]) + '</ol>'
        else:
            body += f'<p>{part}</p>'
    rel = [_paper(a) for a in pr.get("related", [])]           # the papers it builds on or that came out of it, on Publications
    rel_html = ("" if not rel else '<div class="pub-rel"><span class="k">Related papers</span><ul>' + "".join(
        f'<li style="--k:{k}"><a href="publications.html#{_pub_id(q)}">{q["title"]}</a> <span class="muted">{q["year"]}</span></li>'
        for k, q in enumerate(rel)) + '</ul></div>')
    return (f'<details class="fund-more"><summary><span class="t-show">Research proposal</span><span class="t-hide">Hide the proposal</span>'
            f'{PKG_CHEVRON}</summary><div class="fund-abs"><span class="k">Title</span><p class="fund-ptitle">{pr["title"]}</p>'
            f'<span class="k">Abstract</span>{body}{rel_html}</div></details>')


def fund_card(year, name, agency, country, amount, dur, status):
    main, _, approx = amount.partition(" (")
    approx = approx.rstrip(")")
    tags = '<span class="tag">awarded</span>' + (f' <span class="tag grey">{status.lower()}</span>' if status else "")
    import re
    m = re.search(r"\(([A-Z]+)\)", agency)
    acr = m.group(1) if m else {"Alexander von Humboldt Foundation": "AvH", "University of Zürich": "UZH",
                                 "Ministry of Human Resource Development": "MHRD"}.get(agency, "")
    medal = _ix(_p("M15 25L11 39L16 36.5L18 40M25 25L29 39L24 36.5L22 40", "thin") + _p("M20 3A13 13 0 1 1 19.9 3Z")
                + _p("M20 6.5A9.5 9.5 0 1 1 19.9 6.5Z", "thin")
                + f'<text x="20" y="19" text-anchor="middle" font-size="{7.4 if len(acr) < 4 else 6}">{acr}</text>', "ix fund-medal", "0 0 40 42") if acr else ""
    return (f'<article class="fund" id="{_slug(name)}">{medal}<div class="fund-top"><span>{year}</span><span>{country}</span></div>'
            f'<h4 class="fund-name">{name}</h4><div class="fund-agency">{agency}</div>'
            f'<div class="fund-amount">{main}</div>'
            f'<div class="fund-meta">{approx} <span class="sep">·</span> {dur}</div>'
            f'<div class="fund-tags">{tags}</div>{_proposal_html(name)}'
            f'<button class="on-board" type="button" data-pick="{name}" aria-label="Show the {name} on the chart above">'
            'On the chart <span aria-hidden="true">↑</span></button></article>')


def render_funding():
    senior = [f for f in FUNDING if int(f[0]) >= 2024]
    junior = [f for f in FUNDING if int(f[0]) < 2024]
    return ('<h3 class="sect">Postdoctoral fellowships and grants</h3>'
            '<div class="funds two">' + "".join(fund_card(*f) for f in senior) + '</div>'
            '<h3 class="sect">Doctoral and master’s fellowships</h3>'
            '<div class="funds three">' + "".join(fund_card(*f) for f in junior) + '</div>' + BOARD_JS)


# The courses that have equations and figures on the chalkboard at the top of the Teaching page (EQUATIONS in scenes.js).
BOARD_COURSES = ("Quantum Field Theory", "Flavour Physics", "Introductory Physics")


def render_teaching():
    def board(course):
        return ('' if not course.startswith(BOARD_COURSES) else
                f'<button class="on-board" type="button" data-course="{course}" aria-label="Show {course} on the chalkboard above">'
                'On the board <span aria-hidden="true">↑</span></button>')
    return '<div class="courses">' + "".join(
        f'<article class="course" id="{_slug(course)}">{_pick_icon(COURSE_ICONS, course)}<div class="kicker">{y} <span class="sep">·</span> {inst}</div>'
        f'<h4 class="course-title">{course}</h4><div class="course-role">{role}</div>'
        f'<p>{desc}</p>{board(course)}</article>'
        for y, course, role, inst, desc in TEACHING) + '</div>' + BOARD_JS


BOARD_JS = """<script>
(function () {                              // a card asks the animation at the top for its own part: a course's equations,
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;   // a student's project, an award
  Array.prototype.forEach.call(document.querySelectorAll('.on-board'), function (b) {
    b.addEventListener('click', function () {
      if (window.CustomEvent) document.dispatchEvent(b.dataset.course ? new CustomEvent('chalkcourse', { detail: { course: b.dataset.course } })
                                                                    : new CustomEvent('scenepick', { detail: { name: b.dataset.pick } }));
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
</script>"""


def render_supervision():
    return '<div class="students">' + "".join(
        f'<article class="student" id="{_slug(name)}">{_pick_icon(STUDENT_ICONS, thesis)}<div class="kicker">{y} <span class="sep">·</span> {lvl}</div>'
        f'<h4 class="student-name">{name}</h4><div class="student-inst">{inst}</div>'
        f'<p class="student-thesis"><span>Thesis</span><i>{thesis}</i></p>'
        f'<button class="on-board" type="button" data-pick="{name}" aria-label="Show the project of {name} in the animation above">'
        'In the animation <span aria-hidden="true">↑</span></button></article>'
        for y, name, lvl, inst, thesis in SUPERVISION) + '</div>' + BOARD_JS


def _logo(f, alt, lazy=True):
    """A logo with its size in pixels written in, so that the page keeps its place while it loads
    (the CV shows its logos near the top, so there they load at once)."""
    import struct
    path = f"assets/logos/{f}.png"
    w, h = struct.unpack(">II", Path(path).read_bytes()[16:24])          # from the PNG header
    return (f'<img src="{path}?v={_ver(path)}" alt="{alt}" width="{w}" height="{h}" '
            + ('loading="lazy">' if lazy else 'decoding="async">'))


def _cv_id(e):
    """The anchor of a position or a degree in the CV, from its title and city."""
    return _slug(f'{e["title"]} {e["where"].split(",")[0]}')


def render_positions(items):
    out = []
    for p in items:
        logos = "".join(_logo(f, alt, lazy=False) for f, alt in p["logos"])
        note = f'<p class="blk-note">{p["note"]}</p>' if p.get("note") else ""
        meta = f'<p class="blk-meta">{p["meta"]}</p>' if p.get("meta") else ""
        if p.get("facts"):
            meta += '<dl class="blk-facts">' + "".join(
                f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in p["facts"]) + '</dl>'
        out.append(
            f'<article class="blk" id="{_cv_id(p)}"><div class="blk-logos">{logos}</div>'
            f'<div class="blk-body"><div class="blk-when">{p["when"]}</div>'
            f'<h4 class="blk-title">{p["title"]}</h4><div class="blk-org">{p["org"]}</div>'
            f'{note}{meta}<div class="blk-where">{p["where"]}</div>'
            f'<button class="on-board" type="button" data-pick="{p["title"]} · {p["when"]}" '
            f'aria-label="Show {p["title"]}, {p["when"]}, on the timeline above">On the timeline <span aria-hidden="true">↑</span></button></div></article>')
    return "\n".join(out) + (BOARD_JS if items is EDUCATION else "")   # once, after both lists


# On hover (see style.css) each drawing does what its tools do: particles fly out of the collision of an event
# generator, a histogram fills bin by bin, a spectrum appears level by level from the lightest state, a boson is
# exchanged between two vertices, and the loop momentum runs around the loop.
TOOL_ICONS = [
    ("Programming", _p("M16 7L8 15L16 23M32 7L40 15L32 23") + _p("M27 5L21 25", "thin")),
    ("Event generation", _pf("M24 15L7 6", 19.24, "thin") + _pf("M24 15L41 4", 20.25, "thin") + _pf("M24 15L44 19", 20.4, "thin") + _pf("M24 15L31 28", 14.76, "thin") + _pf("M24 15L5 24", 21.02, "thin")
     + '<circle cx="24" cy="15" r="2.2" style="--k:0"/>'),
    ("Analysis", _p("M4 27H44", "thin") + "".join(f'<path class="bar" pathLength="1" style="--k:{k}" d="M{x} 27V{y}"/>'
                                                for k, (x, y) in enumerate([(8, 17), (15, 10), (22, 5), (29, 11), (36, 18), (43, 23)]))),
    ("Model building", "".join(f'<path class="lvl" pathLength="1" style="--k:{k}" d="M{x} {y}H{x + 12}"/>'
                               for k, (x, y) in enumerate([(8, 25), (28, 22), (8, 17), (28, 12), (8, 7), (28, 4)]))),
    ("Diagrams", _p("M4 4L15 15L4 26M44 4L33 15L44 26", "thin") + _pf("M15 15Q17 11 19 15T23 15T27 15T31 15T33 15", 28.4) + _dots([(15, 15), (33, 15)], 1.7)),
    ("Loop integrals", _p("M3 15H14M34 15H45", "thin") + _pf("M24 5A10 10 0 1 1 23.9 5Z", 62.83) + _dots([(14, 15), (34, 15)], 1.7)),
]


def _slug(text):
    """An id for a heading or a card: lower case, plain letters, words joined by hyphens."""
    import unicodedata
    t = unicodedata.normalize("NFKD", re.sub(r"<[^>]+>", "", text)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def _tour_slides():
    """How many slides the research tour has, counted in assets/scenes.js."""
    m = re.search(r"var TOUR = \[([^\]]*)\]", Path("assets/scenes.js").read_text(encoding="utf-8"))
    return len(re.findall(r"[A-Z][A-Z0-9]+", m.group(1))) if m else 0


def _tour_list():
    """The slides of the tour in their order, as scenes.js defines them: key, paper and caption."""
    src = Path("assets/scenes.js").read_text(encoding="utf-8")
    defs = {m.group(1): (m.group(2), m.group(3), m.group(4)) for m in re.finditer(
        r"var (\w+) = (?:diagramVignette\()?\{\s*key: '([^']+)', paper: '([^']+)',[^\n]*?cap: '([^']+)'", src)}
    order = re.findall(r"[A-Z][A-Z0-9]+", re.search(r"var TOUR = \[([^\]]*)\]", src).group(1))
    return [defs[v] for v in order if v in defs]


def render_cv_awards():
    """The fellowships and grants in the CV, one line each: each opens its card, with the amount and the research
    proposal, on the Funding page (so that the details stay in one place)."""
    rows = []
    for y, name, agency, country, _amount, _dur, status in FUNDING:
        tag = f' <span class="aw-st">{status}</span>' if status else ""
        rows.append(f'<a class="award" href="funding.html#{_slug(name)}"><span class="aw-y">{y}</span>'
                    f'<span class="aw-b"><span class="aw-n">{name}</span><span class="aw-a">{agency} · {country}{tag}</span></span>'
                    f'<span class="aw-go" aria-hidden="true">→</span></a>')
    return "\n".join(rows)


def tour_index():
    """Under the Research title: a button that lists every slide of the tour, to start the one chosen
    (the list is filled in by the tour itself, from its slides and their papers)."""
    n = _tour_slides()
    return (f'    <button class="tour-all" type="button" aria-haspopup="dialog">All slides of the tour<span class="ca-n">{n}</span></button>\n'
            '    <dialog class="ss tour-list" aria-labelledby="tl-title"><div class="ss-box">'
            '<div class="ss-head"><span class="kh-title" id="tl-title">The tour, slide by slide</span>'
            '<button class="ss-close tl-close" type="button" aria-label="Close">Esc</button></div>'
            '<ol class="tour-index"></ol></div></dialog>\n')


def nav_drops():
    """What opens under each item of the menu: the parts of its page, with a line about some of them."""
    arts = sum(1 for p in PUBS if p["kind"] == "article")
    procs = sum(1 for p in PUBS if p["kind"] == "proceedings")
    rest = len(TALKS) - TALK_CARDS
    return {
        "#about": [("About me", "index.html#about", ""), ("Academic journey", "index.html#academic-journey", "Kolkata to San Francisco"),
                   ("Recent news", "index.html#recent-news", ""), ("Explore the site", "index.html#explore", "")],
        "research.html": [("A tour of my papers", "research.html#top", f"{_tour_slides()} animated slides"),
                          ("Research domains", "research.html#research-domains", ""),
                          ("Selected work", "research.html#selected-work", ""),
                          ("A map of the papers", "research.html#a-map-of-the-papers", "Placed by what they are about"),
                          ("One integral, two series", "research.html#one-integral-two-series", "Two series on a slider")],
        "publications.html": [("Journal articles", "publications.html#journal-articles", f"{arts} papers"),
                              ("Conference proceedings", "publications.html#conference-proceedings", f"{procs} contributions"),
                              ("PhD thesis", "publications.html#thesis", "IISc, 2022")],
        "software.html": [(pk["name"], f'software.html#{pk["slug"]}', pk["tagline"]) for pk in PACKAGES]
                         + [(LIBRARY["name"], f'software.html#{LIBRARY["slug"]}', "Two-loop RG equations of the SM with five scalar leptoquarks")],
        "talks.html": [("Recent talks", "talks.html#talks", f"The latest {TALK_CARDS}"),
                       ("Earlier talks", "talks.html#earlier-talks", f"{rest} more since {TALKS[-1][0]}")],
        "funding.html": [(h, f"funding.html#{_slug(h)}", "") for h in ("Postdoctoral fellowships and grants", "Doctoral and master’s fellowships")],
        "teaching.html": [(c, f"teaching.html#{_slug(c)}", f"{inst}, {y}") for y, c, _r, inst, _d in TEACHING],
        "supervision.html": [(n, f"supervision.html#{_slug(n)}", f"{lvl}, {y}") for y, n, lvl, _i, _t in SUPERVISION],
        "cv.html": [("Positions", "cv.html#positions", ""), ("Education", "cv.html#education", ""),
                    ("Fellowships and grants", "cv.html#fellowships-and-grants", ""),
                    ("Research interests", "cv.html#research-interests", ""), ("Computing", "cv.html#computing", ""),
                    ("Refereeing", "cv.html#refereeing", ""), ("Download the CV (PDF)", "assets/cv/Sumit_Banik_CV.pdf", "")],
        "contact.html": [("Write to me", f"mailto:{PROFILE['email']}", PROFILE["email"]), ("Address and profiles", "contact.html#reach", "")],
    }


def render_toolkit():
    return "\n".join(
        f'<div class="tool">{_pick_icon(TOOL_ICONS, group)}<div class="kicker">{group}</div>'
        f'<ul>{"".join(f'<li><a href="{TOOL_URLS[x]}">{x}</a></li>' if x in TOOL_URLS else f"<li>{x}</li>" for x in items)}</ul></div>'
        for group, items in TOOLKIT)


def render_tongues():
    return "\n".join(
        f'<div class="tongue"><span class="t-name">{name}</span><span class="t-level">{level}</span></div>'
        for name, level in LANGUAGES)


def render_software():
    """The Software part of the Research page: each package and the library in a few words, linked to its
    card on the Software page (which opens it), so that the details live in one place only."""
    items = [(pk["name"], pk["slug"], pk["tagline"], _ix(SOFTWARE_ICONS[pk["name"]]),
              f'<span class="tag soft">{pk["releases"][-1][0]}</span>') for pk in PACKAGES]
    items.append((LIBRARY["name"], LIBRARY["slug"], LIBRARY["tagline"], _ix(LIBRARY_ICON), '<span class="tag pheno">Library</span>'))
    return "\n".join(
        f'<a class="card soft-link" href="software.html#{slug}">{icon}<div class="sl-text"><h4>{name}</h4><p>{tag}</p>'
        f'<div class="sl-meta">{badge}<span class="sl-go">Details <span aria-hidden="true">→</span></span></div></div></a>'
        for name, slug, tag, icon, badge in items)



RELEASES_JS = """<script>
(function () {                              // each line of versions draws itself once it is on screen
  var els = Array.prototype.slice.call(document.querySelectorAll('.releases'));
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('drawn'); }); return; }
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('drawn'); io.unobserve(x.target); } });
  }, { threshold: 0.45 });
  els.forEach(function (el) { io.observe(el); });
})();
</script>"""


def render_releases(releases, kicker="Releases"):
    def ref(r):
        return (f'<a class="rel-ref" href="{r}">GitHub release</a>' if r.startswith("http")
                else f'<a class="rel-ref arx" href="https://arxiv.org/abs/{r}">arXiv:{r}</a>')
    items = "".join(
        f'<li style="--i:{i}"><span class="rel-dot" aria-hidden="true"></span><span class="rel-v">{v}</span>'
        f'<span class="rel-when">{when}</span><span class="rel-what">{what}</span>{ref(r)}</li>'
        for i, (v, when, what, r, _) in enumerate(releases))
    return f'<div class="releases"><div class="rel-kicker">{kicker}</div><ol class="rel-line">{items}</ol></div>'


def _paper(arx):
    return next(p for p in PUBS if p.get("arxiv") == arx)


def _pkg_links(name, repo, arx):
    p = _paper(arx)
    doi = f'<a href="https://doi.org/{p["doi"]}">DOI</a>' if p.get("doi") else ""
    return (f'<div class="links pkg-actions"><a class="button gh" href="{repo}" aria-label="{name} on GitHub">'
            f'{ICONS["i_github"]}View on GitHub</a>'
            f'<a class="button pdf" href="https://arxiv.org/pdf/{arx}" aria-label="Download the paper on {name} from arXiv">'
            f'{DOWNLOAD_ICON}Download PDF</a>'
            f'<a class="arx" href="https://arxiv.org/abs/{arx}">arXiv:{arx}</a>{doi}</div>')


def _needs(items):
    return "".join(f'<li><a href="{url}">{n}</a>{f" <span class=\"muted\">({note})</span>" if note else ""}</li>'
                   for n, url, note in items)


COPY_CODE_JS = """<script>
(function () {                              // copy the commands of a package with one click, and say so
  var bs = document.querySelectorAll('.code-copy');
  if (!bs.length) return;
  var ok = navigator.clipboard && window.isSecureContext;
  Array.prototype.forEach.call(bs, function (b) {
    if (!ok) { b.remove(); return; }
    var said = b.nextElementSibling, timer;
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
        b.classList.add('done'); if (said) said.textContent = 'Commands copied';
        clearTimeout(timer);
        timer = setTimeout(function () { b.classList.remove('done'); if (said) said.textContent = ''; }, 2200);
      }).catch(function () {});
    });
  });
})();
</script>"""


def _code_copy(code):
    """The round copy button of the email address, for a block of commands."""
    import html as _html
    return (f'<button class="copy-mail code-copy" type="button" data-copy="{_html.escape(code, quote=True)}" '
            'aria-label="Copy the commands" title="Copy the commands">'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="cm-b" d="M15.5 5.5V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5"/>'
            '<rect class="cm-a" x="8.5" y="8.5" width="11" height="11" rx="2"/><path class="cm-ok" pathLength="1" d="M5.5 12.5l4 4L18.5 7.5"/></svg>'
            '<span class="cm-tip" aria-hidden="true">Copied</span></button><span class="sr-only" role="status" aria-live="polite"></span>')


def _pkg_mentions(name, cited):
    """Other papers and proceedings whose abstract names the package (besides those to cite), linked to their entries."""
    out = []
    for q in PUBS:
        if q.get("arxiv") in cited:
            continue
        text = PUB_DETAILS.get(q.get("inspire", ""), {}).get("abstract", "") + " " + _plain(q["title"])
        if re.search(rf"\b{re.escape(name)}\b", text):
            out.append(f'<li><a href="publications.html#{_pub_id(q)}">{q["title"]}</a> <span class="muted">{q["year"]}</span></li>')
    return (f'<div class="pkg-fact pkg-also"><div class="kicker">Also described in</div><ul>{"".join(out)}</ul></div>' if out else "")


def _pkg_cite(papers):
    """How to cite a package: the papers of its releases (a version each) or of the library, each linked to its entry on
    the Publications page, with their BibTeX entries from INSPIRE copied in one click."""
    import html as _html
    items, bibs = [], []
    for arx, version in papers:
        q = _paper(arx)
        bib = PUB_DETAILS.get(q.get("inspire", ""), {}).get("bibtex", "")
        if bib.startswith("@"):
            bibs.append(bib)
        items.append(f'<li><a href="publications.html#{_pub_id(q)}">{q["ref"]}</a>'
                     + (f' <span class="muted">{version}</span>' if version else "") + '</li>')
    if not bibs:
        return ""
    label = "Copy BibTeX" if len(bibs) == 1 else f"Copy the {NUMBER_WORDS[len(bibs)]} BibTeX entries"
    return (f'<div class="pkg-fact pkg-cite"><div class="kicker">Cite</div><ul>{"".join(items)}</ul>'
            f'<button class="cite-copy" type="button" data-copy="{_html.escape(chr(10).join(bibs), quote=True)}">'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5"/>'
            f'<rect x="8.5" y="8.5" width="11" height="11" rx="2"/></svg><span class="cc-l">{label}</span></button>'
            '<span class="sr-only" role="status" aria-live="polite"></span></div>')


def _pkg_facts(heads, files, repo, load, cite=""):
    import html as _html
    clone = f"git clone {repo}.git"
    code = clone + (f"\n{load}" if load else "")
    get = (f'<div class="pkg-fact pkg-get"><div class="kicker">Get it</div><div class="pkg-codebox"><pre class="pkg-code"><code>{_html.escape(code)}</code></pre>'
           + _code_copy(code) + '</div>'
           + ('<p class="pkg-note">then, in <i>Mathematica</i>, load the package with the second line.</p>' if load else "")
           + '</div>')
    blocks = "".join(f'<div class="pkg-fact"><div class="kicker">{h}</div><ul>{body}</ul></div>' for h, body in heads)
    files_html = "".join(f"<li><code>{f}</code></li>" for f in files)
    return (f'<div class="pkg-facts">{blocks}<div class="pkg-fact"><div class="kicker">Files</div><ul class="pkg-files">{files_html}</ul></div>'
            f'{get}{cite}</div>')


NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]


PKG_CHEVRON = '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>'


def _pkg_card(slug, icon, name, tagline, badges, what, body, more):
    """A package or library folded up to its name, a line about it and its badges. A click opens the rest."""
    return (f'<article class="pkg" id="{slug}"><details class="pkg-more"><summary>'
            f'<span class="pkg-head">{icon}<span class="pkg-title"><h3>{name}</h3>'
            f'<span class="pkg-tagline">{tagline}</span></span><span class="pkg-badges">{badges}</span></span>'
            f'<span class="pkg-what">{what}</span>'
            f'<span class="pkg-toggle"><span class="t-show">{more}</span><span class="t-hide">Hide details</span>{PKG_CHEVRON}</span>'
            f'</summary><div class="pkg-body">{body}</div></details></article>')


PKG_OPEN_JS = """<script>
(function () {                              // a link to a package opens it
  function show() {
    var id = decodeURIComponent((location.hash || '').slice(1)), el = id && document.getElementById(id);
    var d = el && el.matches && el.matches('.pkg') && el.querySelector('details.pkg-more');   // a package, not the whole list
    if (d) d.open = true;
  }
  show(); window.addEventListener('hashchange', show);
})();
</script>"""


def render_packages():
    out = []
    for pk in PACKAGES:
        latest = pk["releases"][-1][0]
        heads = [("Requires", _needs(pk["needs"]))]
        if pk["extras"]:
            heads.append((pk["extras"][0], _needs([(n, u, "") for n, u in pk["extras"][1]])))
        out.append(_pkg_card(
            pk["slug"], _ix(SOFTWARE_ICONS[pk["name"]]), pk["name"], pk["tagline"],
            f'<span class="tag grey">Mathematica</span><span class="tag grey">GPL-3.0</span><span class="tag soft">{latest}</span>',
            pk["what"],
            _pkg_links(pk["name"], pk["repo"], pk["paper"]) + render_releases(pk["releases"])
            + _pkg_facts(heads, pk["files"], pk["repo"], pk["load"],
                         _pkg_cite([(r[3], r[0] if len(pk["releases"]) > 1 else "") for r in pk["releases"] if not r[3].startswith("http")])
                         + _pkg_mentions(pk["name"], {r[3] for r in pk["releases"]})),
            "Show details"))
    n_rel = sum(len(pk["releases"]) for pk in PACKAGES)
    return ('<section class="chapter" id="packages">\n<h2 class="chapter-title">Packages</h2>\n'
            f'<p class="prose">{NUMBER_WORDS[len(PACKAGES)].capitalize()} open-source <i>Mathematica</i> packages for Feynman integrals and hypergeometric '
            f'functions, developed with my collaborators, with {NUMBER_WORDS[n_rel]} releases so far. All are free to use under the GNU '
            'General Public License, version 3.</p>\n' + "\n".join(out) + "\n" + RELEASES_JS + COPY_CODE_JS + PKG_OPEN_JS + "\n</section>")


def render_library():
    lb = LIBRARY
    heads = [("Computed with", _needs(lb["tools"]))]
    return ('<section class="chapter" id="library">\n<h2 class="chapter-title">Library</h2>\n'
            '<p class="prose">Results that come with a paper, collected so that others can use them.</p>\n'
            + _pkg_card(lb["slug"], _ix(LIBRARY_ICON), lb["name"], lb["tagline"],
                        f'<span class="tag grey">Mathematica</span><span class="tag grey">GPL-3.0</span><span class="tag pheno">{lb["when"]}</span>',
                        lb["what"], _pkg_links(lb["name"], lb["repo"], lb["paper"])
                        + _pkg_facts(heads, lb["files"], lb["repo"], "", _pkg_cite([(lb["paper"], "")])),
                        "Show details") + '\n' + CITE_JS + '\n</section>')


def software_jsonld():
    import json
    def entry(name, what, repo, arx, version=None):
        p = _paper(arx)
        e = {"@type": "SoftwareSourceCode", "name": name, "description": _plain(what), "codeRepository": repo,
             "programmingLanguage": "Wolfram Language", "license": "https://www.gnu.org/licenses/gpl-3.0.html",
             "author": [{"@type": "Person", "name": a.strip()} for a in p["authors"].split(",")],
             "citation": f"https://doi.org/{p['doi']}" if p.get("doi") else f"https://arxiv.org/abs/{arx}"}
        if version:
            e["softwareVersion"] = version.lstrip("v")
        return e
    graph = [entry(pk["name"], pk["what"], pk["repo"], pk["paper"], pk["releases"][-1][0]) for pk in PACKAGES]
    graph.append(entry(LIBRARY["name"], LIBRARY["what"], LIBRARY["repo"], LIBRARY["paper"]))
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def pubs_jsonld():
    """Each paper as a ScholarlyArticle (the thesis as a Thesis), with its authors, year, journal and identifiers,
    for search engines."""
    kinds = {"article": "ScholarlyArticle", "proceedings": "ScholarlyArticle", "thesis": "Thesis"}
    graph = []
    for q in PUBS:
        e = {"@type": kinds[q["kind"]], "name": _plain(q["title"]).strip(), "datePublished": str(q["year"]),
             "author": [{"@type": "Person", "name": a.strip()} for a in _plain(q["authors"]).split(",") if a.strip()],
             "url": f'{PROFILE["url"]}publications.html#{_pub_id(q)}'}
        ids = []
        if q.get("doi"):
            ids.append({"@type": "PropertyValue", "propertyID": "DOI", "value": q["doi"]})
            e["sameAs"] = [f"https://doi.org/{q['doi']}"]
        if q.get("arxiv"):
            ids.append({"@type": "PropertyValue", "propertyID": "arXiv", "value": q["arxiv"]})
            e.setdefault("sameAs", []).append(f"https://arxiv.org/abs/{q['arxiv']}")
        if ids:
            e["identifier"] = ids
        ref = _plain(q["ref"]).strip()
        if ref and q["kind"] != "thesis":           # the journal, or the meeting for proceedings without a volume
            name = q.get("venue") if "proceedings" in ref else re.split(r"\s+\d", ref)[0].strip().rstrip(",")
            e["isPartOf"] = {"@type": "Periodical", "name": name}
        graph.append(e)                            # (the abstracts are in the page itself, so not repeated here)
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("</", "<\\/")


def toolchain_scene_data():
    """The packages in the order of the chain in the Software header, with the line about each."""
    by = {pk["name"]: pk for pk in PACKAGES}
    return dict(pk=[dict(n=n, tag=by[n]["tagline"], slug=by[n]["slug"]) for n in ("MBConicHulls", "FeynGKZ", "HyperPrecision")])


def software_scene_data():
    """The packages and the library in time, for the header of the Software page."""
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    full = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    def when(w):
        m, y = w.split()
        return int(y) + (months.index(m) + 0.5) / 12, f"{full[months.index(m)]} {y}"
    rel = []
    for i, pk in enumerate(PACKAGES):
        for v, w, _what, r, short in pk["releases"]:
            d, wl = when(w)
            rel.append(dict(l=i, v=v, d=round(d, 3), c=f'{pk["name"]} {v}, {short}', h=wl + " · " + (f'<span class="arx">arXiv</span>:{r}' if not r.startswith("http") else "on GitHub")))
    d, wl = when(LIBRARY["when"])
    rel.append(dict(l=len(PACKAGES), v="", d=round(d, 3), c=f'{LIBRARY["name"]}, the library', h=f'{wl} · <span class="arx">arXiv</span>:{LIBRARY["paper"]}'))
    rel.sort(key=lambda r: r["d"])
    t = date.today()
    return dict(lanes=[pk["name"] for pk in PACKAGES] + [LIBRARY["name"]], releases=rel, now=round(t.year + (t.month - 0.5) / 12, 3))


def jsonld():
    import json
    P = PROFILE
    return json.dumps({
        "@context": "https://schema.org", "@type": "Person",
        "name": P["name"], "givenName": "Sumit", "familyName": "Banik",
        "honorificSuffix": "PhD", "jobTitle": P["title"],
        "worksFor": [{"@type": "Organization", "name": "SLAC National Accelerator Laboratory"},
                     {"@type": "CollegeOrUniversity", "name": "Stanford University"}],
        "alumniOf": [{"@type": "CollegeOrUniversity", "name": "Indian Institute of Science"},
                     {"@type": "CollegeOrUniversity", "name": "University of Calcutta"}],
        "email": f"mailto:{P['email']}", "url": P["url"],
        "knowsAbout": ["Feynman integrals", "Mellin-Barnes integrals", "hypergeometric functions", "GKZ hypergeometric systems",
                       "Higgs physics", "two-Higgs-doublet models", "Higgs triplets", "leptoquarks",
                       "beyond the Standard Model", "collider phenomenology", "effective field theory", "SMEFT",
                       "renormalization group", "computer algebra"],
        "workLocation": {"@type": "Place", "name": "SLAC National Accelerator Laboratory",
                         "address": {"@type": "PostalAddress", "streetAddress": "2575 Sand Hill Road", "addressLocality": "Menlo Park",
                                     "addressRegion": "CA", "postalCode": "94025", "addressCountry": "US"}},
        **({"image": P["url"] + P["portrait"]} if P.get("portrait") else {}),
        "sameAs": [f"https://orcid.org/{P['orcid']}", P["inspire"], P["scholar"], P["github"], P["linkedin"]],
    }, ensure_ascii=False)


# --------------------------------------------------------------------------
# Pages. Each page reuses blocks of the rendered template: the home page gets
# the full hero, the others a compact page header. Every page ends with the
# contact band and the footer.
# --------------------------------------------------------------------------
PAGES = [
    # file,              menu label,     page title,              subtitle,                                                         sections
    ("index.html",        None,           None,                    None,                                                             ["about", "explore"]),
    ("research.html",     "Research",     "Research",              "Feynman integrals, effective field theories and physics beyond the Standard Model.", ["research", "software"]),
    ("publications.html", "Publications", "Publications",          "Journal articles, conference proceedings and my PhD thesis.",   ["publications"]),
    ("software.html",     "Software",     "Software",              "Open-source packages and a library for precision calculations.", ["packages", "library"]),
    ("talks.html",        "Talks",        "Talks",                 "Invited seminars and conference talks since 2020.",             ["talks"]),
    ("funding.html",      "Funding",      "Research Funding",      "Fellowships and grants awarded for my research.",               ["funding"]),
    ("teaching.html",     "Teaching",     "Teaching",              "Courses I have taught in Zürich and Bengaluru.",                 ["teaching"]),
    ("supervision.html",  "Supervision",  "Supervision",           "Students whose research projects I have supervised.",           ["supervision"]),
    ("cv.html",           "CV",           "Curriculum Vitae",      "Positions, education, skills and service to the community.",   ["cv", "refereeing"]),
    ("contact.html",      "Contact",      "Contact",               "Feel free to get in touch. I am always happy to hear from you.", ["reach"]),
]

def _intro():
    """Opening reveal, once per visit (see <head>): two proton beams meet at the centre of the screen and the
    collision sends charged particles out through the faint layers of a detector, each track bent into a
    circle by the magnetic field (the softer the particle, the tighter its curl), with two neutral ones
    straight. The page then opens from the collision point."""
    import math
    import random
    rnd = random.Random(7)                      # the same collision every time
    tracks = []
    n = 17
    for i in range(n):
        phi = 2 * math.pi * (i + rnd.uniform(-0.3, 0.3)) / n
        q = rnd.choice((-1, 1))
        R = rnd.choice((rnd.uniform(26, 60), rnd.uniform(70, 160), rnd.uniform(200, 520)))   # radius of curvature
        L = rnd.uniform(48, 92) if R > 60 else rnd.uniform(30, 0.9 * math.pi * R)            # arc length
        cx, cy = -math.sin(phi) * q * R, math.cos(phi) * q * R                                 # centre of the circle
        a = q * L / R
        x = cx + (0 - cx) * math.cos(a) - (0 - cy) * math.sin(a)
        y = cy + (0 - cx) * math.sin(a) + (0 - cy) * math.cos(a)
        large = 1 if abs(a) > math.pi else 0
        sweep = 1 if q > 0 else 0
        hard = R > 180
        tracks.append(f'<path class="tr{" hard" if hard else ""}" pathLength="1" style="--d:{0.66 + i * 0.014:.3f}s;--t:{0.42 if hard else 0.62:.2f}s"'
                      f' d="M0 0A{R:.1f} {R:.1f} 0 {large} {sweep} {x:.1f} {y:.1f}"/>')
    for i, phi in enumerate((0.9, 3.9)):     # two neutral particles, straight
        tracks.append(f'<path class="tr nu" pathLength="1" style="--d:{0.7 + i * 0.03:.2f}s;--t:.5s" d="M0 0L{95 * math.cos(phi):.1f} {95 * math.sin(phi):.1f}"/>')
    rings = "".join(f'<circle class="ly" cx="0" cy="0" r="{r}" style="--d:{0.12 + k * 0.08:.2f}s"/>' for k, r in enumerate((9, 21, 34, 52)))
    return ('<div class="intro" aria-hidden="true"><svg viewBox="-100 -60 200 120" preserveAspectRatio="xMidYMid slice">'
            f'<g class="det">{rings}</g>'
            '<path class="beam l" pathLength="1" d="M-104 0H-0.6"/><path class="beam r" pathLength="1" d="M104 0H0.6"/>'
            f'<g class="trs">{"".join(tracks)}</g><circle class="flash" cx="0" cy="0" r="6"/></svg></div>\n')


# Opening reveal: a collision at the centre of the screen opens the page (shown once per visit, see <head>).
INTRO = _intro()

# Where each old in-page anchor now lives.
LINK_MAP = {"#about": "index.html#about", "#reach": "contact.html", "#research": "research.html", "#publications": "publications.html",
            "#software": "software.html", "#talks": "talks.html", "#funding": "funding.html",
            "#teaching": "teaching.html", "#supervision": "supervision.html", "#refereeing": "cv.html#refereeing", "#cv": "cv.html"}


# small line drawings for the explore cards, one per page, echoing its header animation
# On hover (see style.css) each drawing does what its page shows: the vertices of the polytope light up in turn, the
# papers along the running total, a talk flies along its arc, the medal wobbles, the releases appear in time order,
# the chalk writes again, the students branch out from their supervisor, the career steps follow one another, and
# the globe turns.
def _kd(pts, r=1.6):                         # dots that light up one after another on hover
    return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" style="--k:{k}"/>' for k, (x, y) in enumerate(pts))


EX_ICONS = {
    "research.html": _p("M6 22L14 5L32 3L43 14L36 27L15 27Z") + _p("M14 5L22 16L32 3M22 16L43 14M22 16L36 27M22 16L15 27M6 22L22 16", "thin")
                     + _kd([(6, 22), (14, 5), (32, 3), (43, 14), (36, 27), (15, 27), (22, 16)]),
    "publications.html": _p("M4 22L13 12L21 17L31 6L44 10", "thin") + _kd([(4, 22), (13, 12), (21, 17), (31, 6), (44, 10)], 2)
                         + _p("M3 28H45"),
    "talks.html": _pf("M4 26Q24 -2 44 18", 48.69) + _p("M2 28Q24 22 46 28", "thin") + _dots([(4, 26)], 2.2)
                  + '<circle cx="44" cy="18" r="2.2" style="--k:4"/>',
    "funding.html": '<g class="wobble">' + _p("M24 4A9 9 0 1 1 23.9 4Z") + _p("M24 8.5A4.5 4.5 0 1 1 23.9 8.5Z", "thin")
                    + _p("M18.5 20L15 29L19.5 27L21 30M29.5 20L33 29L28.5 27L27 30", "thin") + "</g>",
    "software.html": _p("M5 8H44M15 15H44M33 22H44", "thin")
                     + "".join(f'<circle cx="{x}" cy="{y}" r="2" style="--k:{k}"/>' for k, (x, y) in
                               enumerate(sorted([(5, 8), (16, 8), (24, 8), (40, 8), (15, 15), (33, 22), (37, 22)]))),
    "teaching.html": _p("M5 4H43V23H5Z") + _p("M10 12Q13 8 16 12T22 12M25 15H36", "thin") + _p("M9 27H39"),
    "supervision.html": _pf("M6 15C18 15 20 5 40 5", 35.95, "thin") + _pf("M6 15H40", 34, "thin") + _pf("M6 15C18 15 20 25 40 25", 35.95, "thin")
                        + _dots([(6, 15)], 2.6) + _kd([(40, 5), (40, 15), (40, 25)], 2),
    "cv.html": _p("M3 25H45") + "".join(f'<path class="thin step" pathLength="1" style="--k:{k}" d="{d}"/>'
                                        for k, d in enumerate(("M6 19H16", "M14 13H27", "M26 7H38")))
               + '<circle cx="38" cy="7" r="2" style="--k:4"/>',
    "contact.html": _p("M24 3A12 12 0 1 1 23.9 3Z") + _p("M12 15H36M24 3C18 9 18 21 24 27M24 3C30 9 30 21 24 27", "thin")
                    + '<circle class="turn" cx="19" cy="11" r="2"/>',
}


def render_explore(n_articles, n_proc):
    cards = [
        ("research.html", "Research", "Feynman integrals, EFTs and Higgs physics", f"{len(DOMAINS)} research domains · {len(SOFTWARE)} software packages"),
        ("publications.html", "Publications", "Articles, proceedings and thesis", f"{n_articles} journal articles · {n_proc} proceedings"),
        ("software.html", "Software", "Packages and a library", f"{len(PACKAGES)} packages · {sum(len(pk['releases']) for pk in PACKAGES)} releases"),
        ("talks.html", "Talks", "Seminars and conference talks", f"{len(TALKS)} talks since {min(t[0] for t in TALKS)}"),
        ("funding.html", "Funding", "Fellowships and grants", f"{len(FUNDING)} fellowships and grants"),
        ("teaching.html", "Teaching", "Courses and tutorials", f"{len(TEACHING)} courses since {min(t[0] for t in TEACHING)}"),
        ("supervision.html", "Supervision", "Students and their projects", f"{len(SUPERVISION)} students since {min(s[0] for s in SUPERVISION)}"),
        ("cv.html", "CV", "Curriculum vitae", "Positions, education and skills"),
        ("contact.html", "Contact", "Get in touch", "Email, address and profiles"),
    ]
    items = "\n".join(
        f'<a class="ex-card" href="{href}"><span class="ex-num" aria-hidden="true">{n:02d}</span>'
        f'<svg class="ex-icon" viewBox="0 0 48 30" aria-hidden="true">{EX_ICONS[href]}</svg>'
        f'<span class="kicker">{kick}</span><span class="ex-title">{title}</span>'
        f'<span class="ex-meta">{meta}</span><span class="ex-go" aria-hidden="true">→</span></a>'
        for n, (href, kick, title, meta) in enumerate(cards, 1))
    return ('<section class="chapter" id="explore">\n<h2 class="chapter-title">Explore</h2>\n'
            f'<div class="explore">\n{items}\n</div>\n</section>')


# The local time at SLAC on the contact page: a small clock, set by the visitor's browser.
LOCAL_TIME = """    <div class="local-time" data-tz="America/Los_Angeles">
      <svg class="clock" viewBox="0 0 40 40" aria-hidden="true"><circle class="face" cx="20" cy="20" r="18.2"/><line class="tick" x1="20.00" y1="4.80" x2="20.00" y2="3.00"/><line class="tick" x1="27.60" y1="6.84" x2="28.50" y2="5.28"/><line class="tick" x1="33.16" y1="12.40" x2="34.72" y2="11.50"/><line class="tick" x1="35.20" y1="20.00" x2="37.00" y2="20.00"/><line class="tick" x1="33.16" y1="27.60" x2="34.72" y2="28.50"/><line class="tick" x1="27.60" y1="33.16" x2="28.50" y2="34.72"/><line class="tick" x1="20.00" y1="35.20" x2="20.00" y2="37.00"/><line class="tick" x1="12.40" y1="33.16" x2="11.50" y2="34.72"/><line class="tick" x1="6.84" y1="27.60" x2="5.28" y2="28.50"/><line class="tick" x1="4.80" y1="20.00" x2="3.00" y2="20.00"/><line class="tick" x1="6.84" y1="12.40" x2="5.28" y2="11.50"/><line class="tick" x1="12.40" y1="6.84" x2="11.50" y2="5.28"/><line class="h" x1="20" y1="21.5" x2="20" y2="11"/><line class="m" x1="20" y1="22" x2="20" y2="6.5"/><line class="s" x1="20" y1="23.5" x2="20" y2="5"/><circle class="hub" cx="20" cy="20" r="1.5"/></svg>
      <div><span class="lt-label">Local time at SLAC</span><span class="lt-time" aria-live="off"></span><span class="lt-diff"></span></div>
    </div>
    <script>
    (function () {                              // a clock showing the time in Menlo Park, wherever the visitor is
      var box = document.querySelector('.local-time');
      if (!box || !window.Intl || !Intl.DateTimeFormat.prototype.formatToParts) { if (box) box.style.display = 'none'; return; }
      var tz = box.getAttribute('data-tz'), still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var hh = box.querySelector('.h'), mh = box.querySelector('.m'), sh = box.querySelector('.s'), out = box.querySelector('.lt-time');
      var num = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
      var zone = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
      var day = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
      var gapOut = box.querySelector('.lt-diff');
      function part(p, t) { for (var i = 0; i < p.length; i++) if (p[i].type === t) return +p[i].value; return 0; }
      function hours(m) {                       // 540 is 9 hours, 750 is 12½ hours
        var h = Math.floor(m / 60), q = ({ 15: '¼', 30: '½', 45: '¾' })[m % 60] || '';
        return (h || !q ? h : '') + q + (m === 60 ? ' hour' : ' hours');
      }
      function gap(d) {                         // how far the clock at SLAC is from the visitor's own
        var p = day.formatToParts(d), there = Date.UTC(part(p, 'year'), part(p, 'month') - 1, part(p, 'day'), part(p, 'hour') % 24, part(p, 'minute'));
        var off = Math.round((there - Math.floor(d.getTime() / 60000) * 60000) / 60000), m = -d.getTimezoneOffset() - off;
        return m === 0 ? 'The same as your clock' : hours(Math.abs(m)) + (m > 0 ? ' behind you' : ' ahead of you');
      }
      function tick() {
        var d = new Date(), p = num.formatToParts(d), H = part(p, 'hour') % 24, M = part(p, 'minute'), S = part(p, 'second');
        hh.setAttribute('transform', 'rotate(' + ((H % 12) * 30 + M / 2) + ' 20 20)');
        mh.setAttribute('transform', 'rotate(' + (M * 6 + S / 10) + ' 20 20)');
        sh.setAttribute('transform', 'rotate(' + S * 6 + ' 20 20)');
        var z = zone.formatToParts(d).filter(function (x) { return x.type === 'timeZoneName'; })[0];
        out.innerHTML = ((H % 12) || 12) + ':' + (M < 10 ? '0' : '') + M + ' ' + (H < 12 ? 'am' : 'pm') + (z ? ' <span class="lt-zone">' + z.value + '</span>' : '');
        if (S === 0 || !gapOut.textContent) gapOut.textContent = gap(d);
      }
      tick();
      setInterval(tick, still ? 20000 : 1000);
    })();
    </script>"""


COPY_MAIL_JS = """<script>
(function () {                              // copy the email address with one click, and say so
  var b = document.querySelector('.copy-mail');
  if (!b) return;
  if (!(navigator.clipboard && window.isSecureContext)) { b.remove(); return; }
  var said = b.nextElementSibling, timer;
  b.addEventListener('click', function () {
    navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
      b.classList.add('done'); said.textContent = 'Email address copied';
      clearTimeout(timer);
      timer = setTimeout(function () { b.classList.remove('done'); said.textContent = ''; }, 2200);
    }).catch(function () {});
  });
})();
</script>"""


def copy_mail(email):
    """A round button that copies the address: the two sheets give way to a check mark."""
    return (f'<button class="copy-mail" type="button" data-copy="{email}" aria-label="Copy the email address" title="Copy the email address">'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="cm-b" d="M15.5 5.5V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5"/>'
            '<rect class="cm-a" x="8.5" y="8.5" width="11" height="11" rx="2"/><path class="cm-ok" pathLength="1" d="M5.5 12.5l4 4L18.5 7.5"/></svg>'
            '<span class="cm-tip" aria-hidden="true">Copied</span></button>'
            '<span class="sr-only" role="status" aria-live="polite"></span>' + COPY_MAIL_JS)


def write_vcard():
    """A contact card (vCard 3.0) for the address book, linked from the Contact page."""
    P = PROFILE
    first, last = P["name"].split(" ", 1)
    lines = ["BEGIN:VCARD", "VERSION:3.0", f"N:{last};{first};;;", f"FN:{P['name']}",
             "ORG:SLAC National Accelerator Laboratory;Fundamental Physics Directorate", "TITLE:Postdoctoral Researcher",
             f"EMAIL;TYPE=INTERNET,WORK:{P['email']}", f"URL:{P['url']}",
             "ADR;TYPE=WORK:;;2575 Sand Hill Road;Menlo Park;CA;94025;United States", "END:VCARD"]
    Path("assets/sumit-banik.vcf").write_text("\r\n".join(lines) + "\r\n", encoding="utf-8", newline="")


def render_reach():
    P = PROFILE
    profiles = [("ORCID", f"https://orcid.org/{P['orcid']}", "i_orcid"), ("INSPIRE", P["inspire"], "i_inspire"),
                ("Google Scholar", P["scholar"], "i_scholar"), ("arXiv", P["arxiv"], "i_arxiv"),
                ("GitHub", P["github"], "i_github"), ("LinkedIn", P["linkedin"], "i_linkedin")]
    links = "".join(f'<li><a href="{url}">{ICONS[icon]}{name}</a></li>' for name, url, icon in profiles)
    return f'''<section class="chapter" id="reach">
<div class="reach">
  <article class="reach-card">{_ix(REACH_ICONS["Email"])}
    <div class="kicker">Email</div>
    <div class="reach-mail"><a class="reach-big" href="mailto:{P["email"]}">{P["email"]}</a>{copy_mail(P["email"])}</div>
    <p>Email is the best way to reach me.</p>
    <p><a class="button" href="mailto:{P["email"]}">Send an email</a></p>
  </article>
  <article class="reach-card">{_ix(REACH_ICONS["Address"])}
    <div class="kicker">Address</div>
    <p class="reach-addr">Fundamental Physics Directorate<br>SLAC National Accelerator Laboratory<br>2575 Sand Hill Road<br>Menlo Park, CA 94025<br>United States</p>
    {LOCAL_TIME}
    <p class="reach-vcf"><a href="assets/sumit-banik.vcf" download>Add to your contacts <span class="muted">(vCard)</span></a></p>
  </article>
  <article class="reach-card">{_ix(REACH_ICONS["Profiles"])}
    <div class="kicker">Profiles</div>
    <ul class="reach-links">{links}</ul>
  </article>
</div>
</section>'''


MOTION_BUTTON = ('<button class="motion-toggle" type="button" aria-pressed="false" aria-label="Pause the animations" '
                 'title="Pause the animations on every page">'
                 '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="mt-pause" d="M9 6.5v11M15 6.5v11"/>'
                 '<path class="mt-play" d="M8.5 6.2v11.6l9.4-5.8z"/></svg></button>\n')


def stats_tag():
    """GoatCounter's counting script (no cookies, no personal data), loaded on the live site only."""
    code = PROFILE.get("goatcounter")
    if not code:
        return ""
    host = PROFILE["url"].split("//")[1].strip("/")
    return ("<script>(function () {                      // visit statistics, on the live site only\n"
            f"  if (location.hostname !== '{host}') return;\n"
            "  var s = document.createElement('script');\n"
            "  s.async = true; s.src = 'https://gc.zgo.at/count.js';\n"
            f"  s.setAttribute('data-goatcounter', 'https://{code}.goatcounter.com/count');\n"
            "  document.body.appendChild(s);\n"
            "})();</script>\n")


NOT_FOUND_JS = """<script>
(function () {                              // a mistyped address: guess the page from its words, and offer to search for them
  var words = decodeURIComponent(location.pathname).toLowerCase().replace(/\\.html?$/, '')
    .split(/[^a-z0-9\\u00e0-\\u00ff]+/).filter(function (w) { return w.length > 2; });
  if (!words.length) return;
  var pages = [['the home page', '/', 'home index about'], ['Research', '/research.html', 'research tour domains'],
    ['Publications', '/publications.html', 'publications publication papers paper articles pubs thesis'],
    ['Software', '/software.html', 'software code packages package library mbconichulls feyngkz hyperprecision slq'],
    ['Talks', '/talks.html', 'talks talk seminars seminar slides'], ['Funding', '/funding.html', 'funding grants fellowships fellowship'],
    ['Teaching', '/teaching.html', 'teaching courses course'], ['Supervision', '/supervision.html', 'supervision students student'],
    ['the CV', '/cv.html', 'cv resume curriculum vitae'], ['Contact', '/contact.html', 'contact email mail address']];
  function edits(a, b) {                     // how many letters to change to turn one word into the other
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) d[i] = [i];
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  var best = null, bestScore = 99;
  words.forEach(function (w) {
    pages.forEach(function (pg) {
      pg[2].split(' ').forEach(function (k) {
        var sc = k.indexOf(w) === 0 && w.length >= 4 ? 0 : edits(w, k);
        if (sc < bestScore && sc <= Math.max(1, Math.floor(k.length / 4))) { bestScore = sc; best = pg; }
      });
    });
  });
  var guess = document.querySelector('.nf-guess'), find = document.querySelector('.nf-find');
  if (best && guess) {
    var a = guess.querySelector('.nf-page'); a.textContent = best[0]; a.setAttribute('href', best[1]); guess.hidden = false;
  }
  var q = words.join(' ');
  if (find && document.querySelector('.ss-btn')) {
    find.querySelector('.nf-q').textContent = q; find.hidden = false;
    find.querySelector('button').addEventListener('click', function () {
      var input = document.querySelector('.ss-input'); if (input) input.value = q;
      document.querySelector('.navbar .ss-btn').click();
    });
  }
})();
</script>"""


def _heading_levels(page):
    """Inner pages drop the section title that their header already shows, so their headings would skip levels
    (a page title, then card titles three levels down). For screen readers the outline is told again without gaps,
    with aria-level where a heading's place differs from its tag: each heading sits one level below the nearest
    earlier heading of a smaller tag."""
    stack = []
    def fix(m):
        level, attrs = int(m.group(1)), re.sub(r'\saria-level="\d"', "", m.group(2) or "")
        while stack and stack[-1] >= level:
            stack.pop()
        stack.append(level)
        place = len(stack)
        return f'<h{level}{attrs}' + (f' aria-level="{place}"' if place != level else "") + '>'
    return re.sub(r"<h([1-6])(\s[^>]*)?>", fix, page)


def write_pages(html, n_articles, n_proc):
    import json
    import re
    P = PROFILE
    head = html[:html.index('<body id="top">')]
    hero = html[html.index('<header class="masthead hero">'):html.index('<div class="navbar">')]
    ticker = html[html.index('<div class="ticker"'):html.index('<main id="main"')]
    tail = html[html.index('</main>'):]
    sections = {m.group(1): m.group(0) for m in
                re.finditer(r'<section class="chapter" id="([a-z]+)">.*?</section>', html, re.S)}
    sections["explore"] = render_explore(n_articles, n_proc)
    sections["reach"] = render_reach()
    sections["packages"] = render_packages()
    sections["library"] = render_library()

    def _local(href, current):
        page, _, frag = href.partition("#")
        return f"#{frag}" if frag and page == current else href

    def navbar(current):
        here = ' class="here" aria-current="page"'
        drops = nav_drops()
        def item(key, href, label, cur):
            sub = "".join(f'<a href="{_local(h, current)}"><span class="nd-t">{t}</span>'
                          + (f'<span class="nd-n">{n}</span>' if n else "") + '</a>' for t, h, n in drops.get(key, []))
            page = "" if key == "#about" else f'<a class="nd-page" href="{href}">{label} page <span aria-hidden="true">→</span></a>'   # first, on touch screens
            panel = f'<div class="nav-drop">{page}{sub}</div>' if sub else ""
            return f'<div class="nav-item"><a href="{href}"{here if cur else ""}>{label}</a>{panel}</div>'
        about = "#about" if current == "index.html" else "index.html#about"      # About, on the home page, comes first
        links = item("#about", about, "About", False) + "".join(item(f, f, label, f == current) for f, label, *_ in PAGES if label)
        toggle = ('<button class="theme-toggle" type="button" aria-pressed="false" aria-label="Dark mode" title="Switch to dark mode">'
                  '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="tt-sun"><circle cx="12" cy="12" r="4.2"/>'
                  '<path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M5.4 18.6l1.5-1.5M17.1 6.9l1.5-1.5"/></g>'
                  '<path class="tt-moon" d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"/></svg></button>')
        find = ('<button class="ss-btn" type="button" aria-label="Search the site" title="Search the site (press /)">'
                '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg></button>')
        return (f'<div class="navbar">\n  <div class="wrap nav-inner">\n'
                f'    <a class="brand" href="index.html">{P["name"]}</a>\n'
                f'    <nav aria-label="Pages">{links}</nav>\n    <div class="nav-tools">{find}{toggle}</div>\n  </div>\n</div>\n'
                + find.replace('class="ss-btn"', 'class="ss-btn corner"', 1)
                + toggle.replace('class="theme-toggle"', 'class="theme-toggle corner"', 1) + '\n')

    def letters(text):
        out, i = [], 0
        for word in text.split():
            out.append('<span class="w" aria-hidden="true">' + "".join(
                f'<span class="ch" style="--i:{i + k}">{c}</span>' for k, c in enumerate(word)) + '</span>')
            i += len(word) + 1
        return " ".join(out)

    scenes = page_scenes()

    def page_hero(label, title, sub, file="", extra=""):
        scene = scenes.get(file)
        if scene:
            name, caption, hint, data = scene
            attr = f' data-scene="{name}"'
            payload = ""
            if data:
                blob = json.dumps(data(), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
                payload = f'    <script type="application/json" class="scene-data">{blob}</script>\n'
            stage = (f'   <div class="hero-stage" aria-hidden="true">\n{payload}'
                     f'    <div class="scene-meta"><p class="scene-cap">{caption}</p><p class="scene-hint">{hint}</p></div>\n'
                     f'   </div>\n')
        else:
            attr, stage = "", '   <div class="hero-stage" aria-hidden="true" title="Click for a new collision"></div>\n'
        return (f'<header class="masthead hero page-hero"{attr}>\n  <canvas class="field" aria-hidden="true"></canvas>\n'
                f'  <div class="wrap hero-inner">\n   <div class="hero-text">\n'
                f'    <p class="crumb"><a href="index.html">{P["name"]}</a><span aria-hidden="true">/</span>{label}</p>\n'
                f'    <h1 class="page-title" aria-label="{title}">{letters(title)}</h1>\n    <p class="page-sub">{sub}</p>\n{extra}   </div>\n'
                f'{stage}  </div>\n</header>\n')

    def relink(body, current):
        for anchor, target in LINK_MAP.items():
            file, _, frag = target.partition("#")
            local = ("#" + frag) if frag else "#top"
            body = body.replace(f'href="{anchor}"', f'href="{local if file == current else target}"')
        return body

    written, changed = [], set()
    for file, label, title, sub, secs in PAGES:
        url = P["url"] + ("" if file == "index.html" else file)
        h = head
        if file != "index.html":
            desc = f"{title} of Sumit Banik, theoretical particle physicist at SLAC and Stanford. {sub}"
            h = re.sub(r"<title>.*?</title>", f"<title>{title} | Sumit Banik</title>", h)
            h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', h)
            h = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{desc}">', h)
            h = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{title} | Sumit Banik">', h)
            h = re.sub(r'<script type="application/ld\+json">.*?</script>\n', "", h, flags=re.S)
        if file == "software.html":                 # the packages, described for search engines
            h = h.replace("</head>", f'<script type="application/ld+json">{software_jsonld()}</script>\n</head>', 1)
        if file == "publications.html":             # and the papers
            h = h.replace("</head>", f'<script type="application/ld+json">{pubs_jsonld()}</script>\n</head>', 1)
        h = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', h)
        h = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', h)

        slug = file.replace(".html", "")
        parts = []
        for i, s in enumerate(secs + ([] if file == "contact.html" else ["contact"])):
            block = sections[s]
            if file != "index.html" and i == 0:           # the page header already carries the title
                block = re.sub(r'<h2 class="chapter-title">.*?</h2>\n?', "", block, count=1, flags=re.S)
            parts.append(block)
        body = (f'<body id="top" class="page-{slug}">\n{INTRO}<a class="skip" href="#main">Skip to content</a>\n\n'
                + (hero if file == "index.html" else page_hero(label, title, sub, file, tour_index() if file == "research.html" else ""))
                + navbar(file)
                + (ticker if file == "index.html" else "")
                + '<main id="main" class="wrap">\n\n' + "\n\n".join(parts) + "\n\n" + tail)
        if file in scenes:                                # the page scenes live in their own script
            body = body.replace("</body>", f'<script src="assets/scenes.js?v={_ver("assets/scenes.js")}" defer></script>\n</body>', 1)
        body = body.replace("</body>", stats_tag() + "</body>", 1)
        body = body.replace("</header>", MOTION_BUTTON + "</header>", 1)   # pause the moving pictures (WCAG 2.2.2)
        body = re.sub(r'<h3 class="sect"((?: data-[a-z]+="[^"]*")?)>(.*?)</h3>',   # an id for the menu's links, and a link to copy
                      lambda m: f'<h3 class="sect" id="{_slug(m.group(2))}"{m.group(1)}>{m.group(2)}'
                                f'<a class="sec-link" href="#{_slug(m.group(2))}" aria-hidden="true" tabindex="-1">{SEC_LINK_ICON}</a></h3>', body)
        if "sec-link" in body:
            body = body.replace("</body>", SEC_LINK_JS + "\n</body>", 1)
        page_html = _heading_levels(relink(h + body, file))
        if not Path(file).exists() or Path(file).read_text(encoding="utf-8") != page_html:
            changed.add(file)                              # for the sitemap: the day each page last changed
        Path(file).write_text(page_html, encoding="utf-8")
        written.append(file)

    # a friendly 404 page for mistyped addresses
    nf = (head.replace("<title>Sumit Banik | Theoretical Particle Physics</title>", "<title>Page not found | Sumit Banik</title>")
          + '<body id="top" class="page-404">\n' + INTRO + '<a class="skip" href="#main">Skip to content</a>\n\n' + page_hero("Not found", "Page not found",
            "The page you are looking for does not exist. Like a neutrino, it left the detector without a trace.",
            extra='    <div class="ev-note" aria-hidden="true"><p class="ev-kicker">At the Large Hadron Collider</p>'
                  '<p class="ev-label"></p><p class="ev-say"></p></div>\n')
          + navbar("") + '<main id="main" class="wrap">\n<section class="chapter nf-help">'
          '<p class="nf-guess" hidden>Perhaps you were looking for <a class="nf-page" href="index.html">the home page</a>.</p>'
          '<p class="nf-find" hidden><button class="button nf-search" type="button">Search the site for “<span class="nf-q"></span>”</button></p>'
          '<p class="about-links"><a href="index.html">Go to the home page <span aria-hidden="true">→</span></a></p></section>\n'
          + NOT_FOUND_JS + '\n'
          + sections["contact"] + "\n\n" + tail)
    nf = re.sub(r'<link rel="canonical" href="[^"]*">\n?', "", nf)   # count a missing page under its own address
    nf = nf.replace("</body>", stats_tag() + "</body>", 1)
    nf = relink(nf, "404.html").replace("</header>", MOTION_BUTTON + "</header>", 1)
    nf = re.sub(r'(\s(?:href|src)=")(?![a-z][a-z0-9+.-]*:|/|#)', r"\1/", nf)   # served at any depth, so every address starts at the root
    Path("404.html").write_text(nf.replace('href="/index.html"', 'href="/"'), encoding="utf-8")

    # sitemap for search engines, with the day each page last changed (kept in tools/lastmod.json between builds)
    lm_path = Path("tools/lastmod.json")
    try:
        lastmod = json.loads(lm_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        lastmod = {}
    today = date.today().isoformat()
    for f, *_ in PAGES:
        if f in changed or f not in lastmod:
            lastmod[f] = today
    lm_path.write_text(json.dumps(lastmod, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    urls = "".join(f"<url><loc>{P['url'] + ('' if f == 'index.html' else f)}</loc><lastmod>{lastmod[f]}</lastmod></url>" for f, *_ in PAGES)
    Path("sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
                                   f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    Path("robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {P['url']}sitemap.xml\n")
    print(f"wrote {', '.join(written)}, 404.html, sitemap.xml  ({len(PUBS)} publications, {len(TALKS)} talks)")


def _ver(path):
    """Short version tag from the file's modification time, so browsers never show a stale copy."""
    return format(int(Path(path).stat().st_mtime), "x")


def main():
    P = PROFILE
    visitor_assets()
    n_articles = sum(p["kind"] == "article" for p in PUBS)
    n_proc = sum(p["kind"] == "proceedings" for p in PUBS)
    n_invited = sum(t[5] for t in TALKS)
    name_letters = "".join(
        f'<span class="w" aria-hidden="true">' + "".join(
            f'<span class="ch" style="--i:{i + 6 * wi}">{c}</span>' for i, c in enumerate(word)) + '</span> '
        for wi, word in enumerate(P["name"].split())).strip()
    hero_portrait = (f'<figure class="hero-portrait"><div class="arch"><img src="{P["portrait"]}?v={_ver(P["portrait"])}" '
                     f'alt="Portrait of Sumit Banik" width="560" height="700"></div></figure>'
                     if P["portrait"] and Path(P["portrait"]).exists() else "")
    portrait = (f'<figure class="portrait-frame" data-hold="1500"><img class="portrait" src="{P["portrait"]}?v={_ver(P["portrait"])}" alt="Portrait of Sumit Banik" width="560" height="700"></figure>'
                if P["portrait"] and Path(P["portrait"]).exists()
                else '')
    desc = ("Sumit Banik, theoretical particle physicist at SLAC and Stanford: "
            "Feynman integrals, Mellin-Barnes and hypergeometric methods, Higgs physics "
            "and physics beyond the Standard Model.")

    import hashlib
    index = json.dumps(search_index(), ensure_ascii=False, separators=(",", ":"))
    if not Path("assets/search.json").exists() or Path("assets/search.json").read_text(encoding="utf-8") != index:
        Path("assets/search.json").write_text(index, encoding="utf-8")
    search_v = hashlib.md5(index.encode("utf-8")).hexdigest()[:8]

    html = TEMPLATE.format(
        desc=desc, url=P["url"], jsonld=jsonld(), portrait=portrait,
        email=P["email"], orcid=P["orcid"], inspire=P["inspire"], scholar=P["scholar"],
        arxiv=P["arxiv"], github=P["github"], linkedin=P["linkedin"],
        n_articles=n_articles, n_proc=n_proc, n_talks=len(TALKS), n_packages=len(PACKAGES), n_domains=NUMBER_WORDS[len(DOMAINS)], n_invited=n_invited,
        domain_names=_html_attr(json.dumps({_slug(d[0]): d[0] for d in DOMAINS}, ensure_ascii=False)), coauthors=render_coauthors(),
        pubs=render_pubs(), talks=render_talks(), news=render_news(), selected=render_selected(), continuation=render_continuation(), paper_map=render_paper_map(), journey=render_journey(), domains=render_domains(), journey_map=render_journey_map(), ticker=render_ticker(), funding=render_funding(),
        teaching=render_teaching(), supervision=render_supervision(),
        software=render_software(), fav_v=_ver("assets/favicon.svg"), ico_v=_ver("favicon.ico"), touch_v=_ver("assets/apple-touch-icon.png"), toolkit=render_toolkit(), employment=render_positions(EMPLOYMENT), education=render_positions(EDUCATION), cv_awards=render_cv_awards(), tongues=render_tongues(),
        referee="\n".join(f'<a class="journal" href="{url}"><span class="j-name">{name}</span><span class="j-pub">{pub}</span><span class="j-go" aria-hidden="true">→</span></a>' for name, pub, url in REFEREE),
        ix_pheno=_ix(DOMAIN_ICONS[2]), ix_fi=_ix(DOMAIN_ICONS[0]),
        ix_article=_ix(NEWS_ICONS['paper']), ix_proc=_ix(NEWS_ICONS['proc']), ix_talk=_ix(NEWS_ICONS['talk']), ix_code=_ix(TOOL_ICONS[0][1]),
        n_total=len(PUBS), name_letters=name_letters, hero_portrait=hero_portrait, v_css=_ver("assets/style.css"), **ICONS,
        updated=date.today().strftime("%B %Y"), year=date.today().year, visitors=render_visitors(), search_v=search_v,
    )
    write_vcard()
    write_pages(html, n_articles, n_proc)
    check_links()


def search_index():
    """Everything the search box (press / on any page) looks through, each with the place on the site it opens:
    title, a line under it, the kind and year, and longer text (abstracts and descriptions) searched but not shown."""
    out = []
    def add(kind, year, title, sub, url, body=""):
        e = {"k": kind, "y": str(year or ""), "t": _plain(title).strip(), "s": " ".join(_plain(sub).split()), "u": "/" + url}
        if re.search(r"<(i|sub|sup|span)\b", title):           # a title with maths in it is shown as on the page
            e["h"] = re.sub(r"<(?!/?(i|sub|sup|span)\b)[^>]+>", "", title).strip()
        if body:
            e["b"] = " ".join(_plain(body).split())
        out.append(e)
    for f, label, title, sub, _secs in PAGES:
        if label:
            add("Page", "", title, sub, f)
    kinds = {"article": "Paper", "proceedings": "Proceedings", "thesis": "Thesis"}
    for p in PUBS:
        det = PUB_DETAILS.get(p.get("inspire", ""), {})
        topics = " ".join(TOPIC_LABEL[t] for t in p["topic"].split())
        add(kinds[p["kind"]], p["year"], p["title"], f'{p["authors"]} · {p["ref"]}', f"publications.html#{_pub_id(p)}",
            " ".join(x for x in (_tex_html(det.get("abstract", "")), p.get("arxiv", ""), p.get("venue", ""), topics) if x))
    for tid, (y, ev, city, title, note, invited) in zip(_talk_ids(), TALKS):
        add("Invited talk" if invited else "Talk", y, f"“{title}”", f"{ev} · {city}", f"talks.html#{tid}", note)
    for pk in PACKAGES:
        add("Software", "", pk["name"], pk["tagline"], f'software.html#{pk["slug"]}',
            pk["what"] + " Mathematica " + " ".join(f"{v} {what}" for v, _w, what, *_ in pk["releases"]))
    add("Library", "", LIBRARY["name"], LIBRARY["tagline"], f'software.html#{LIBRARY["slug"]}', LIBRARY["what"])
    for y, course, role, inst, desc in TEACHING:
        add("Teaching", y, course, f"{role} · {inst}", f"teaching.html#{_slug(course)}", desc)
    for y, name, lvl, inst, thesis in SUPERVISION:
        add("Supervision", y, name, f"{lvl} · {inst}", f"supervision.html#{_slug(name)}", thesis)
    for y, name, agency, country, *_rest in FUNDING:
        pr = FUND_PROPOSALS.get(name, {})
        text = " ".join(x if isinstance(x, str) else " ".join(f"{n}. {t}" for n, t in x["list"]) for x in pr.get("abstract", []))
        add("Funding", y, name, f"{agency} · {country}", f"funding.html#{_slug(name)}", f'{pr.get("title", "")} {text}'.strip())
    for kind, items, frag in (("Position", EMPLOYMENT, "positions"), ("Education", EDUCATION, "education")):
        for e in items:
            add(kind, "", e["title"], f'{e["org"]} · {e["when"]}', f"cv.html#{frag}", f'{e["where"]} {e.get("meta", "")}')
    for key, (name, text, keys) in zip(DOMAIN_KEYS, DOMAINS):
        slug = _slug(name)
        n = sum(slug in _domains_of(p) for p in PUBS)
        if key == "tools":
            add("Research domain", "", name, f"{NUMBER_WORDS[len(PACKAGES)].capitalize()} packages and a library · {keys}", "software.html", text)
        else:
            add("Research domain", "", name, f"{n} papers · {keys}", f"publications.html?domain={slug}#publications", text)
    for k, (key, paper, cap) in enumerate(_tour_list(), 1):   # every slide of the tour, which it starts
        q = next((x for x in PUBS if paper in (x.get("arxiv"), x.get("doi"), "inspire:" + x.get("inspire", ""))), None)
        add("Animation", q["year"] if q else "", cap, f"Slide {k} of the tour" + (f' · {q["ref"]}' if q else ""),
            f"research.html#tour-{key}", q["title"] if q else "")
    seen = {e["u"] for e in out}                       # and the parts of each page, as the menu lists them
    names = {f: label for f, label, *_ in PAGES if label}
    names["#about"] = "Home"
    for key, items in nav_drops().items():
        for t, h, n in items:
            if h.startswith("mailto:") or "/" + h in seen:
                continue
            seen.add("/" + h)
            add("File" if h.endswith(".pdf") else "Section", "", t, n or names.get(key, ""), h)
    return out


def check_links():
    """Every link from one page of the site to a part of another must land on something: say so if not."""
    pages = [f for f, *_ in PAGES]
    ids = {f: set(re.findall(r'\sid="([^"]+)"', Path(f).read_text(encoding="utf-8"))) for f in pages}
    bad = []
    for f in pages:
        for href in re.findall(r'href="([^"]+)"', Path(f).read_text(encoding="utf-8")):
            page, _, frag = href.partition("#")
            page = page or f
            if page in ids and frag and frag != "top" and not frag.startswith("tour-") and frag not in ids[page]:
                bad.append(f"{f} -> {href}")
    for b in bad:
        print("broken link:", b)


TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sumit Banik | Theoretical Particle Physics</title>
<meta name="description" content="{desc}">
<meta name="author" content="Sumit Banik">
<link rel="canonical" href="{url}">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#1c352f">
<meta property="og:type" content="profile">
<meta property="og:title" content="Sumit Banik">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{url}assets/portrait.jpg">
<meta name="twitter:card" content="summary">
<link rel="icon" href="favicon.ico?v={ico_v}" sizes="32x32">
<link rel="icon" href="assets/favicon.svg?v={fav_v}" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png?v={touch_v}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap">
<link rel="stylesheet" href="assets/style.css?v={v_css}">
<script type="application/ld+json">{jsonld}</script>
<script>document.documentElement.classList.add("js");try{{if(!sessionStorage.getItem("sb-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){{document.documentElement.classList.add("intro-on");sessionStorage.setItem("sb-intro","1")}}}}catch(e){{}}try{{if(localStorage.getItem("sb-still")==="1")document.documentElement.classList.add("still")}}catch(e){{}}try{{var t=localStorage.getItem("sb-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark")}}catch(e){{}}</script>
</head>
<body id="top">
<a class="skip" href="#main">Skip to content</a>

<header class="masthead hero">
  <div class="aurora" aria-hidden="true"></div>
  <canvas class="field" aria-hidden="true"></canvas>
  <div class="wrap hero-inner">
   <div class="hero-text">
    <h1><a class="name" href="#about" aria-label="Sumit Banik">{name_letters}</a></h1>
    <div class="who">
      <span class="role">Postdoctoral Researcher, <a href="https://fundamentalphysics.slac.stanford.edu/">Fundamental Physics Directorate</a></span>
      <span class="org"><a href="https://theory.slac.stanford.edu/">SLAC National Accelerator Laboratory</a>
        <span class="sep">·</span> <a href="https://www.stanford.edu/">Stanford University</a></span>
    </div>
    <p class="tagline">From the mathematics of Feynman integrals <br class="hero-br">to search for physics beyond the Standard&nbsp;Model.</p>
    <div class="hero-cta">
      <a class="btn solid" href="#research">Explore my research</a>
      <a class="btn" href="#publications">Publications</a>
      <a class="btn" href="assets/cv/Sumit_Banik_CV.pdf">Curriculum vitae</a>
    </div>
    <div class="contact">
      <a class="email" href="mailto:{email}">{i_mail}{email}</a>
      <nav class="profiles" aria-label="Research profiles">
        <a href="https://orcid.org/{orcid}">{i_orcid}ORCID</a>
        <a href="{inspire}">{i_inspire}INSPIRE</a>
        <a href="{scholar}">{i_scholar}Google Scholar</a>
        <a href="{arxiv}">{i_arxiv}arXiv</a>
        <a href="{github}">{i_github}GitHub</a>
        <a href="{linkedin}">{i_linkedin}LinkedIn</a>
      </nav>
    </div>
   </div>
   <div class="hero-stage" aria-hidden="true" title="Click for a new collision"><div class="ev-mini"><p class="ev-kicker">At the Large Hadron Collider</p><p class="ev-label"></p><p class="ev-say"></p></div></div>
  </div>
  <a class="scroll-cue" href="#about" aria-label="Scroll to the About section"><span></span></a>
  <div class="ev" aria-hidden="true">
    <p class="ev-kicker">At the Large Hadron Collider</p>
    <p class="ev-label"></p>
    <p class="ev-say"></p>
    <ul class="ev-legend"><li><svg viewBox="0 0 36 10"><path class="lg-q" d="M1 7 Q18 1 35 5"/></svg>Quark</li><li><svg viewBox="0 0 36 10"><path class="lg-g" d="M1.00 5.00 L1.18 5.93 L1.03 6.74 L0.62 7.32 L0.06 7.59 L-0.54 7.51 L-1.04 7.09 L-1.34 6.40 L-1.35 5.52 L-1.01 4.57 L-0.34 3.68 L0.64 2.96 L1.83 2.52 L3.12 2.41 L4.39 2.64 L5.52 3.19 L6.39 3.98 L6.95 4.91 L7.16 5.85 L7.04 6.67 L6.66 7.28 L6.10 7.58 L5.50 7.53 L4.99 7.15 L4.66 6.48 L4.62 5.61 L4.92 4.66 L5.57 3.76 L6.51 3.02 L7.69 2.55 L8.98 2.40 L10.26 2.60 L11.40 3.12 L12.30 3.90 L12.89 4.81 L13.14 5.76 L13.05 6.60 L12.69 7.23 L12.15 7.56 L11.55 7.55 L11.01 7.20 L10.67 6.55 L10.60 5.70 L10.86 4.75 L11.47 3.84 L12.39 3.08 L13.55 2.58 L14.83 2.40 L16.12 2.57 L17.28 3.06 L18.21 3.81 L18.84 4.72 L19.11 5.67 L19.05 6.53 L18.71 7.18 L18.19 7.54 L17.59 7.57 L17.04 7.25 L16.67 6.63 L16.57 5.79 L16.80 4.85 L17.38 3.92 L18.28 3.15 L19.41 2.61 L20.69 2.40 L21.98 2.54 L23.16 3.00 L24.12 3.73 L24.77 4.63 L25.08 5.58 L25.06 6.45 L24.74 7.13 L24.23 7.52 L23.63 7.58 L23.07 7.29 L22.68 6.70 L22.55 5.88 L22.75 4.94 L23.30 4.01 L24.16 3.21 L25.28 2.65 L26.55 2.41 L27.84 2.51 L29.04 2.94 L30.02 3.65 L30.71 4.54 L31.05 5.49 L31.06 6.37"/></svg>Gluon</li><li><svg viewBox="0 0 36 10"><path class="lg-a" d="M1 5 q2.25 -4 4.5 0 t4.5 0 t4.5 0 t4.5 0 t4.5 0 t4.5 0 t4.5 0 t4.5 0"/></svg>Photon</li><li><svg viewBox="0 0 36 10"><path class="lg-e" d="M1 6 Q18 2 35 4"/></svg>Electron</li><li><svg viewBox="0 0 36 10"><path class="lg-m" d="M1 5 H35"/></svg>Muon</li><li><svg viewBox="0 0 36 10"><path class="lg-n" d="M1 5 H31"/><path class="lg-n-head" d="M30 2 L35 5 L30 8 Z"/></svg>Neutrino</li></ul>
  </div>
</header>

<div class="navbar">
  <div class="wrap">
    <nav aria-label="Sections">
      <a href="#about">About</a><a href="#research">Research</a><a href="#publications">Publications</a><a href="#software">Software</a><a href="#talks">Talks</a><a href="#funding">Funding</a><a href="#teaching">Teaching</a><a href="#refereeing">Refereeing</a><a href="#cv">CV</a><a href="#contact">Contact</a>
    </nav>
  </div>
</div>

<div class="ticker" aria-hidden="true"><div class="ticker-track">{ticker}{ticker}</div></div>

<main id="main" class="wrap">

<section class="chapter" id="about">
<h2 class="chapter-title">About</h2>
<div class="about-grid">
{portrait}
<div class="about-text">
<p class="statement" data-hold="2600">I am a postdoctoral researcher at SLAC National Accelerator Laboratory
and Stanford University. My research in theoretical particle physics spans
applied mathematics, multi-loop Feynman integrals, effective field theories,
model building, Higgs physics and the search for New Physics beyond the
Standard Model at particle colliders.</p>
<p class="about-links"><a href="assets/cv/Sumit_Banik_CV.pdf">Read the full CV <span aria-hidden="true">→</span></a>
<a href="contact.html">Get in touch <span aria-hidden="true">→</span></a></p>
</div>
</div>

<h3 class="sect">Academic journey</h3>
{journey_map}
<ol class="journey legend" data-hold="2900">
{journey}
</ol>

<div class="stats">
  <a class="stat" href="publications.html#journal-articles">{ix_article}<span class="n">{n_articles}</span><span class="l">journal articles</span></a>
  <a class="stat" href="publications.html#conference-proceedings">{ix_proc}<span class="n">{n_proc}</span><span class="l">conference proceedings</span></a>
  <a class="stat" href="talks.html#talks">{ix_talk}<span class="n">{n_talks}</span><span class="l">talks &amp; seminars</span></a>
  <a class="stat" href="software.html#packages">{ix_code}<span class="n">{n_packages}</span><span class="l">software packages</span></a>
</div>

<h3 class="sect">Recent news</h3>
<ul class="news">
{news}
</ul>
</section>

<section class="chapter" id="research">
<h2 class="chapter-title">Research</h2>
<figure class="epigraph">
  <blockquote><p>A physical law must possess mathematical beauty.</p></blockquote>
  <figcaption>P. A. M. Dirac, 1955</figcaption>
</figure>
<h3 class="sect">Research domains</h3>
<div class="themes six">
{domains}
</div>
<h3 class="sect">Selected work</h3>
<div class="picks">
{selected}
</div>
<h3 class="sect">A map of the papers</h3>
{paper_map}
<h3 class="sect">One integral, two series</h3>
{continuation}
</section>

<section class="chapter" id="publications">
<h2 class="chapter-title">Publications</h2>
<p class="muted" style="margin-bottom:0">Complete and up-to-date records:
<a href="{inspire}" style="white-space: nowrap">INSPIRE-HEP</a> · <a href="{arxiv}">arXiv</a> · <a href="https://orcid.org/{orcid}">ORCID</a>.</p>
<div class="filters" role="group" aria-label="Filter publications by topic">
  <button type="button" data-filter="all" aria-pressed="true">All ({n_total})</button>
  <button type="button" data-filter="fi" aria-pressed="false">Feynman integrals</button>
  <button type="button" data-filter="pheno" aria-pressed="false">Phenomenology</button>
  <button type="button" data-filter="soft" aria-pressed="false">Software</button>
  <input class="pub-search" id="pub-search" name="q" type="search" placeholder="Search publications" aria-label="Search publications">
  <span class="dom-chip" hidden data-names="{domain_names}"><span class="dc-l">Research domain</span><b class="dc-n"></b>
  <button class="dc-x" type="button" aria-label="Show the papers of every domain" title="Show every domain">×</button></span>
</div>
{coauthors}
<div class="pub-tools"><span class="pub-count" role="status" aria-live="polite"></span>
<button class="pub-openall" type="button" aria-pressed="false">Open every abstract</button>
<span class="pub-sort" role="group" aria-label="Order of the papers"><button type="button" data-sort="new" aria-pressed="true">Newest first</button><button type="button" data-sort="cited" aria-pressed="false">Most cited first</button></span>
<button class="cite-copy bib-all" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5"/><rect x="8.5" y="8.5" width="11" height="11" rx="2"/></svg><span class="cc-l">Copy BibTeX</span></button>
<button class="bib-file" type="button" title="The same entries as a .bib file">.bib file</button></div>
<p class="pub-empty" hidden>No publications match your search.</p>
{pubs}
<button class="pub-more" type="button">Show all {n_total} publications</button>
</section>

<section class="chapter" id="software">
<h2 class="chapter-title">Software</h2>
<p class="prose">The open-source <i>Mathematica</i> packages and the library that came out of this research, developed with my collaborators.
Each one opens on the <a href="software.html">Software page</a>, with its versions, requirements and installation.</p>
<div class="cards soft-index">
{software}
</div>
</section>

<section class="chapter" id="talks">
<h2 class="chapter-title">Talks</h2>
{talks}
</section>

<section class="chapter" id="funding">
<h2 class="chapter-title">Research Funding</h2>
{funding}
</section>

<section class="chapter" id="teaching">
<h2 class="chapter-title">Teaching</h2>
{teaching}
</section>

<section class="chapter" id="supervision">
<h2 class="chapter-title">Supervision</h2>
{supervision}
</section>

<section class="chapter" id="refereeing">
<h2 class="chapter-title">Refereeing</h2>
<p class="muted">Referee for the following journals.</p>
<div class="journals">
{referee}
</div>
</section>

<section class="chapter" id="cv">
<h2 class="chapter-title">Curriculum Vitae</h2>
<p><a class="button" href="assets/cv/Sumit_Banik_CV.pdf">Download full CV (PDF)</a></p>

<h3 class="sect">Positions</h3>
<div class="positions work">
{employment}
</div>

<h3 class="sect">Education</h3>
<div class="positions study">
{education}
</div>

<h3 class="sect">Fellowships and grants</h3>
<div class="awards">
{cv_awards}
</div>

<h3 class="sect">Research interests</h3>
<div class="interests">
  <div class="interest pheno">{ix_pheno}
    <div class="kicker">Particle phenomenology</div>
    <ul>
      <li><button class="int-q" type="button" data-ss="LHC" title="Search the site for LHC">Collider phenomenology</button></li>
      <li><button class="int-q" type="button" data-ss="new physics" title="Search the site for new physics">Beyond the Standard Model</button></li>
      <li><button class="int-q" type="button" data-ss="Higgs" title="Search the site for Higgs">Higgs physics</button></li>
      <li><button class="int-q" type="button" data-ss="SMEFT" title="Search the site for SMEFT">Effective field theory</button></li>
    </ul>
  </div>
  <div class="interest fi">{ix_fi}
    <div class="kicker">Mathematical &amp; computational methods</div>
    <ul>
      <li><button class="int-q" type="button" data-ss="Feynman integrals" title="Search the site for Feynman integrals">Multi-loop Feynman integrals</button></li>
      <li><button class="int-q" type="button" data-ss="hypergeometric" title="Search the site for hypergeometric">Hypergeometric functions</button></li>
      <li><button class="int-q" type="button" data-ss="Mellin-Barnes" title="Search the site for Mellin-Barnes">Mellin-Barnes representation</button></li>
      <li><button class="int-q" type="button" data-ss="Mathematica" title="Search the site for Mathematica">Computer algebra</button></li>
    </ul>
  </div>
</div>

<p class="about-links"><a href="research.html#research-domains">The {n_domains} research domains on the Research page <span aria-hidden="true">→</span></a></p>

<h3 class="sect">Computing</h3>
<div class="toolkit">
{toolkit}
</div>

<h3 class="sect">Languages</h3>
<div class="tongues">
{tongues}
</div>
</section>

<section class="chapter" id="contact">
<h2 class="chapter-title">Contact</h2>
<div class="contact-card">
  <p class="prose contact-lede">Feel free to get in touch. I am always happy to hear from you.</p>
  <p><a class="button" href="mailto:{email}">Send an email</a>
  <span class="contact-alt">or find me on <a href="{inspire}">INSPIRE</a>,
  <a href="{github}">GitHub</a> and <a href="{linkedin}">LinkedIn</a>.</span></p>
</div>
</section>

</main>

<footer>
<div class="wrap foot">
  <div class="foot-id">
    <div class="foot-name">Sumit Banik</div>
    <div class="foot-aff">Fundamental Physics Directorate<br><span class="aff-a">SLAC National Accelerator Laboratory</span><span class="aff-sep"> · </span><span class="aff-a">Stanford&nbsp;University</span></div>
    <a class="foot-mail" href="mailto:{email}">{email}</a>
  </div>
  {visitors}
  <div class="foot-meta">
    <a href="#top">Back to top ↑</a>
    <span>© {year} Sumit Banik · Last updated {updated}</span>
  </div>
</div>
</footer>

<dialog class="ss" aria-labelledby="ss-title" data-src="/assets/search.json?v={search_v}">
 <div class="ss-box">
  <div class="ss-head">
   <svg class="ss-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>
   <label class="sr-only" for="ss-q" id="ss-title">Search the site</label>
   <input class="ss-input" id="ss-q" name="q" type="search" autocomplete="off" spellcheck="false" enterkeyhint="go"
          placeholder="Papers, talks, software, people" role="combobox" aria-expanded="false" aria-controls="ss-list" aria-autocomplete="list">
   <button class="ss-close" type="button" aria-label="Close the search">Esc</button>
  </div>
  <div class="ss-hints"><span class="ss-try">Try</span><button type="button">Mellin-Barnes</button><button type="button">GKZ</button><button type="button">95 GeV</button><button type="button">leptoquarks</button><button type="button">SMEFT</button><button type="button">Zürich</button></div>
  <p class="ss-fix" hidden>Showing results for “<span class="ss-fixed"></span>”. <button type="button" class="ss-orig">Search for “<span></span>” instead</button></p>
  <ul class="ss-list" id="ss-list" role="listbox" aria-label="Results"></ul>
  <div class="ss-foot"><span class="ss-status" role="status" aria-live="polite"></span>
   <span class="ss-keys"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>?</kbd> all shortcuts</span></span></div>
 </div>
</dialog>

<dialog class="ss keys-help" aria-labelledby="kh-title">
 <div class="ss-box kh-box">
  <div class="ss-head"><span class="kh-title" id="kh-title">Keyboard shortcuts</span><button class="ss-close kh-close" type="button" aria-label="Close">Esc</button></div>
  <dl class="kh-list">
   <div><dt><kbd>/</kbd> or <kbd>Ctrl</kbd> <kbd>K</kbd></dt><dd>Search the whole site</dd></div>
   <div><dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd></dt><dd>Choose and open a result</dd></div>
   <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Step through the animation at the top of a page: the papers of the tour, the awards, the equations on the board, the students or the stages of the CV</dd></div>
   <div><dt><kbd>J</kbd> <kbd>K</kbd></dt><dd>The next or previous paper of the list, on the Publications page</dd></div>
   <div><dt><kbd>O</kbd></dt><dd>Open or fold the abstract of that paper</dd></div>
   <div><dt><kbd>P</kbd></dt><dd>Pause or play the animations, on every page</dd></div>
   <div><dt><kbd>Esc</kbd></dt><dd>Close a search, a menu or this list</dd></div>
   <div><dt><kbd>?</kbd></dt><dd>Show this list</dd></div>
  </dl>
 </div>
</dialog>

<div class="progress" aria-hidden="true"></div>
<a class="to-top" href="#top" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg></a>

<script>
(function () {{
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reveal(el) {{
    if (!el.classList.contains('reveal') || el.classList.contains('in')) return;
    el.classList.add('in');
    var delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
    var hold = parseInt(el.dataset.hold, 10) || 900;
    setTimeout(function () {{ el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); }}, hold + delay);
  }}

  /* ---------- publications: topic filter, search, show more ---------- */
  var buttons = document.querySelectorAll('.filters button[data-filter]');   // the topics (not the cross of the domain)
  var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));
  var heads = document.querySelectorAll('#publications .sect');
  var search = document.querySelector('.pub-search');
  var more = document.querySelector('.pub-more');
  var empty = document.querySelector('.pub-empty');
  var LIMIT = 8, topic = 'all', query = '', open = false, domain = '';
  var chip = document.querySelector('.dom-chip'), dnames = {{}};
  try {{ dnames = JSON.parse(chip.dataset.names); }} catch (e) {{}}
  var dparam = (location.search.match(/[?&]domain=([a-z-]+)/) || [])[1];
  if (chip && dparam && dnames[dparam]) {{                 // from a domain card on the Research page
    domain = dparam; chip.querySelector('.dc-n').textContent = dnames[dparam]; chip.hidden = false;
    buttons.forEach(function (x) {{ if (x.dataset.filter === 'all') x.setAttribute('aria-pressed', 'false'); }});   // not all of them
  }}
  var pq = {{}};                                       // a shared view of the list: ?topic=pheno&q=higgs (and ?domain=)
  location.search.replace(/[?&]([a-z]+)=([^&]*)/g, function (m, k, v) {{ try {{ pq[k] = decodeURIComponent(v.replace(/\\+/g, ' ')); }} catch (e) {{}} }});
  if (pq.topic && pq.topic !== 'all' && document.querySelector('.filters button[data-filter="' + pq.topic.replace(/[^a-z]/g, '') + '"]')) {{
    topic = pq.topic;
    buttons.forEach(function (x) {{ x.setAttribute('aria-pressed', x.dataset.filter === topic ? 'true' : 'false'); }});
  }}
  if (pq.q && search) {{ search.value = pq.q.slice(0, 80); query = search.value.replace(/\\s+/g, ' ').trim().toLowerCase(); }}
  var syncURL = function () {{                      // and the address follows the list, so that what is shown can be shared
    if (!history.replaceState || !buttons.length) return;
    var ps = [];
    if (domain) ps.push('domain=' + domain);
    if (topic !== 'all') ps.push('topic=' + topic);
    if (query && search) ps.push('q=' + encodeURIComponent(search.value.trim()).replace(/%20/g, '+'));
    var url = location.pathname + (ps.length ? '?' + ps.join('&') : '') + location.hash;
    if (url !== location.pathname + location.search + location.hash) history.replaceState(null, '', url);
  }};
  var clearDomain = function () {{
    if (!domain) return;
    domain = ''; chip.hidden = true;
    if (topic === 'all') buttons.forEach(function (x) {{ x.setAttribute('aria-pressed', x.dataset.filter === 'all'); }});
    syncURL();
  }};
  /* the BibTeX of every paper in the list as it is filtered, in one click */
  var bibAll = document.querySelector('.bib-all'), pubCount = document.querySelector('.pub-count'), bibList = [], bibTimer;
  if (bibAll && !(navigator.clipboard && window.isSecureContext)) {{ bibAll.remove(); bibAll = null; }}
  var bibLabel = function () {{
    if (!bibAll || bibAll.classList.contains('done')) return;
    var n = bibList.length;
    bibAll.hidden = !n;
    var bf = document.querySelector('.bib-file'); if (bf) bf.hidden = !n;
    bibAll.querySelector('.cc-l').textContent = n === pubs.length ? 'Copy all ' + n + ' BibTeX entries'
      : n === 1 ? 'Copy its BibTeX' : 'Copy these ' + n + ' BibTeX entries';
  }};
  var bibFile = document.querySelector('.bib-file');                     // the same entries, saved as a file
  if (bibFile) bibFile.addEventListener('click', function () {{
    var list = bibList.map(function (p) {{ var c = p.querySelector('.cite-copy'); return c ? c.getAttribute('data-copy') : ''; }}).filter(Boolean);
    if (!list.length || !window.Blob || !window.URL) return;
    var url = URL.createObjectURL(new Blob([list.join('\\n\\n') + '\\n'], {{ type: 'application/x-bibtex' }})), a = document.createElement('a');
    a.href = url; a.download = 'banik-publications.bib'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () {{ URL.revokeObjectURL(url); }}, 1000);
  }});
  if (bibAll) bibAll.addEventListener('click', function () {{
    var list = bibList.map(function (p) {{ var c = p.querySelector('.cite-copy'); return c ? c.getAttribute('data-copy') : ''; }}).filter(Boolean);
    if (!list.length) return;
    navigator.clipboard.writeText(list.join('\\n\\n') + '\\n').then(function () {{
      bibAll.classList.add('done');
      bibAll.querySelector('.cc-l').textContent = list.length === 1 ? 'BibTeX copied' : list.length + ' entries copied';
      clearTimeout(bibTimer);
      bibTimer = setTimeout(function () {{ bibAll.classList.remove('done'); bibLabel(); }}, 2400);
    }}).catch(function () {{}});
  }});
  function pubText(p) {{                              // what a search looks through: the card, not the abstract
    if (!p.dataset.q) p.dataset.q = Array.prototype.map.call(p.querySelectorAll('.title, .meta, .detail, .links a, .links .tag'),
      function (x) {{ return x.textContent; }}).join(' ').replace(/\\s+/g, ' ').toLowerCase();   // (names are held together by no-break spaces)
    return p.dataset.q;
  }}
  function applyPubs() {{
    var shown = 0, matches = 0, narrowed = topic !== 'all' || query !== '' || domain !== '', keys = [], arrived = 0, matched = [];
    pubs.forEach(function (p) {{
      var ok = (topic === 'all' || p.dataset.topic.split(' ').indexOf(topic) >= 0) &&
               (!domain || (p.dataset.domains || '').split(' ').indexOf(domain) >= 0) &&
               (!query || pubText(p).indexOf(query) >= 0);
      if (ok) {{ matches++; matched.push(p); var tt = p.querySelector('.title'); if (tt) keys.push(tt.textContent.replace(/\u00a0/g, ' ').trim()); }}
      var vis = ok && (open || narrowed || shown < LIMIT);
      if (vis) shown++;
      if (vis && p.hidden && booted && !reduce) {{         // a paper that comes back glides into place, a little after the one before
        p.style.setProperty('--k', Math.min(arrived++, 10));
        p.classList.remove('pub-in'); void p.offsetWidth; p.classList.add('pub-in');
      }}
      p.hidden = !vis;
      if (vis) reveal(p);
    }});
    heads.forEach(function (h) {{
      var el = h.nextElementSibling, any = false;
      while (el && el.classList.contains('pub')) {{ if (!el.hidden) any = true; el = el.nextElementSibling; }}
      h.hidden = !any;
    }});
    if (more) more.hidden = open || narrowed || matches <= LIMIT;
    bibList = matched; bibLabel();
    if (openAll && openAll.getAttribute('aria-pressed') === 'true')   // "every abstract" holds for papers the filters bring back
      pubs.forEach(function (p) {{ var d = p.querySelector('details.pub-open'); if (d && !p.hidden) d.open = true; }});
    if (pubCount) pubCount.textContent = !pubs.length ? '' : (matches === pubs.length ? 'All ' + matches + ' papers'
      : matches === 1 ? 'One paper of ' + pubs.length : !matches ? 'No papers of ' + pubs.length : matches + ' papers of ' + pubs.length);
    if (empty) empty.hidden = matches > 0;
    if (window.CustomEvent) document.dispatchEvent(new CustomEvent('pubfilter', {{ detail: {{ narrowed: narrowed, titles: keys }} }}));
    if (booted) syncURL();
  }}
  buttons.forEach(function (b) {{
    b.addEventListener('click', function () {{
      topic = b.dataset.filter;
      if (topic === 'all') clearDomain();             // "All" means every paper again
      buttons.forEach(function (x) {{ x.setAttribute('aria-pressed', x === b); }});
      applyPubs();
    }});
  }});
  var cas = document.querySelectorAll('.coauthors button');   // a co-author: the papers written with them, in the search box
  var caSync = function () {{
    Array.prototype.forEach.call(cas, function (b) {{ b.setAttribute('aria-pressed', query && query === b.dataset.q ? 'true' : 'false'); }});
  }};
  Array.prototype.forEach.call(cas, function (b) {{
    b.addEventListener('click', function () {{
      var on = query !== b.dataset.q;
      query = on ? b.dataset.q : ''; if (search) search.value = on ? b.dataset.name : '';
      caSync(); applyPubs();
    }});
  }});
  if (search) search.addEventListener('input', function () {{ query = search.value.replace(/\\s+/g, ' ').trim().toLowerCase(); caSync(); applyPubs(); }});
  if (more) more.addEventListener('click', function () {{ open = true; applyPubs(); }});
  var openAll = document.querySelector('.pub-openall');      // every abstract of the list as it is filtered, open or folded at once
  if (openAll) openAll.addEventListener('click', function () {{
    var on = openAll.getAttribute('aria-pressed') !== 'true';
    openAll.setAttribute('aria-pressed', on ? 'true' : 'false');
    openAll.textContent = on ? 'Fold every abstract' : 'Open every abstract';
    pubs.forEach(function (p) {{ var d = p.querySelector('details.pub-open'); if (d && !p.hidden) d.open = on; }});
  }});
  var kbAt = null;                                           // J and K step through the papers shown, O opens or folds the one marked
  if (pubs.length) document.addEventListener('keydown', function (ev) {{
    var t = ev.target, k = (ev.key || '').toLowerCase(), n;
    if ((k !== 'j' && k !== 'k' && k !== 'o') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if ((t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) || document.querySelector('dialog[open]')) return;
    var list = pubs.filter(function (p) {{ return !p.hidden; }}), i = list.indexOf(kbAt);
    if (!list.length) return;
    if (k === 'o') {{
      var d = i >= 0 && kbAt.querySelector('details.pub-open');
      if (d) {{ d.open = !d.open; ev.preventDefault(); }}
      return;
    }}
    if (i < 0) {{ for (n = 0; n < list.length - 1 && list[n].getBoundingClientRect().bottom < 90; n++) {{}} }}   // from the first paper in view
    else n = Math.max(0, Math.min(list.length - 1, i + (k === 'j' ? 1 : -1)));
    if (kbAt) kbAt.classList.remove('kb');
    kbAt = list[n]; kbAt.classList.add('kb');
    if (!kbAt.hasAttribute('tabindex')) kbAt.setAttribute('tabindex', '-1');
    kbAt.focus({{ preventScroll: true }});
    kbAt.scrollIntoView({{ block: 'center', behavior: reduce ? 'auto' : 'smooth' }});
    ev.preventDefault();
  }});
  document.addEventListener('pointerdown', function () {{ if (kbAt) {{ kbAt.classList.remove('kb'); kbAt = null; }} }});
  var sorts = document.querySelectorAll('.pub-sort button');
  Array.prototype.forEach.call(sorts, function (b) {{
    b.addEventListener('click', function () {{                // newest first, or most cited first (INSPIRE), within each group
      var by = b.dataset.sort, before = [];
      if (!reduce && window.Element && Element.prototype.animate)     // where each paper on screen was, to glide from there
        pubs.forEach(function (p) {{ if (!p.hidden) before.push([p, p.getBoundingClientRect().top]); }});
      Array.prototype.forEach.call(sorts, function (x) {{ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }});
      Array.prototype.forEach.call(heads, function (h) {{
        var group = [], el = h.nextElementSibling;
        while (el && el.classList.contains('pub')) {{ group.push(el); el = el.nextElementSibling; }}
        group.sort(function (x, y) {{
          return by === 'cited' ? (+y.dataset.cited - +x.dataset.cited) || (+y.dataset.n - +x.dataset.n) : +y.dataset.n - +x.dataset.n;
        }});
        var at = h;
        group.forEach(function (p) {{ at.after(p); at = p; }});
      }});
      pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));   // the first eight are now those at the top
      applyPubs();
      before.forEach(function (pb, k) {{                      // each paper still shown moves from its old place to its new one
        var p = pb[0]; if (p.hidden) return;
        var dy = pb[1] - p.getBoundingClientRect().top;
        if (Math.abs(dy) < 1) return;
        p.animate([{{ transform: 'translateY(' + Math.max(-900, Math.min(900, dy)) + 'px)', opacity: Math.abs(dy) > 900 ? 0 : 1 }},
                   {{ transform: 'none', opacity: 1 }}],
                  {{ duration: 620, delay: Math.min(k, 10) * 18, easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'backwards' }});
      }});
    }});
  }});
  if (chip) chip.querySelector('.dc-x').addEventListener('click', function () {{ clearDomain(); applyPubs(); }});
  var booted = false;
  if (query) caSync();                              // a shared search for a co-author presses their name
  applyPubs();
  booted = true;

  /* ---------- a link to a part of a page (from the menu): show it, open it, and bring it into view ---------- */
  function toTarget() {{
    var id = decodeURIComponent((location.hash || '').slice(1)), el = id && document.getElementById(id);
    if (!el) return;
    var moved = false;
    if (el.hidden && el.matches('h3.sect[data-group], .pub')) {{          // the whole list of papers, unfiltered
      if (topic !== 'all' || query || domain) {{
        topic = 'all'; query = ''; if (search) search.value = ''; clearDomain();
        buttons.forEach(function (x) {{ x.setAttribute('aria-pressed', x.dataset.filter === 'all'); }});
      }}
      open = true; applyPubs(); moved = true;
    }}
    var list = el.parentElement && el.parentElement.closest('details');   // inside a list that folds (the browser may have opened it)
    if (list) {{                                   // open it at once, so that the page is long enough to scroll to the row
      list.classList.add('instant'); list.open = true; moved = true;
      setTimeout(function () {{ list.classList.remove('instant'); }}, 800);
    }}
    var d = el.matches('details') ? el : el.matches('.pkg, .pub') ? el.querySelector('details.pkg-more, details.pub-open') : null;   // not a whole section
    if (d && !d.open) {{ d.open = true; moved = true; }}
    if (moved) requestAnimationFrame(function () {{ el.scrollIntoView({{ block: 'start', behavior: reduce ? 'auto' : 'smooth' }}); }});
  }}
  toTarget(); window.addEventListener('hashchange', toTarget);

  /* ---------- scroll reveal (staggered within each group) ---------- */
  var sel = ['.chapter-title', '.epigraph', '.prose > p', '.portrait-frame', '.statement', '.about-links', '.journey', '.news li', '.stat',
             '.theme', '.pick', '.card', '.pub', '.talk-card', '.fund', '.course', '.student',
             '.journal', '.blk', '.interest', '.tool', '.tongues', '.contact-card', '.filters', '.sect', '.ex-card', '.award'];
  var items = document.querySelectorAll(sel.join(','));
  if (!reduce && 'IntersectionObserver' in window) {{
    var seen = new WeakMap();
    Array.prototype.forEach.call(items, function (el) {{
      var parent = el.parentElement, n = seen.get(parent) || 0;
      seen.set(parent, n + 1);
      el.style.setProperty('--d', (n % 6) * 70 + 'ms');
      if (el.querySelector('.ix path.flow, .ex-icon path.flow')) el.dataset.hold = '1800';   // let its flowing lines finish drawing
      el.classList.add('reveal');
    }});
    // Elements revealed with a clip mask have zero visible area while hidden, so the
    // observer would never see them: watch their parent instead.
    var owners = new Map();
    var io = new IntersectionObserver(function (entries) {{
      entries.forEach(function (e) {{
        if (!e.isIntersecting) return;
        (owners.get(e.target) || [e.target]).forEach(reveal);
        io.unobserve(e.target);
      }});
    }}, {{ rootMargin: '0px 0px -8% 0px', threshold: 0.02 }});
    Array.prototype.forEach.call(items, function (el) {{
      if (el.matches('.chapter-title, .portrait-frame')) {{
        var host = el.parentElement, list = owners.get(host);
        if (list) list.push(el); else {{ owners.set(host, [el]); io.observe(host); }}
      }} else io.observe(el);
    }});
  }}

  /* ---------- the spine of the news timeline draws itself down as the list comes into view ---------- */
  var spines = document.querySelectorAll('.news');
  if (!reduce && 'IntersectionObserver' in window) {{
    var so = new IntersectionObserver(function (en) {{
      en.forEach(function (x) {{ if (x.isIntersecting) {{ x.target.classList.add('drawn'); so.unobserve(x.target); }} }});
    }}, {{ rootMargin: '0px 0px -8% 0px', threshold: 0.05 }});
    Array.prototype.forEach.call(spines, function (el) {{ so.observe(el); }});
  }} else Array.prototype.forEach.call(spines, function (el) {{ el.classList.add('drawn'); }});

  /* ---------- counters in the number boxes ---------- */
  var counters = document.querySelectorAll('.stat .n');
  function count(el) {{
    var target = parseInt(el.dataset.count || el.textContent, 10), t0 = null, dur = 1400;
    if (reduce || !target) {{ el.textContent = target; return; }}
    function tick(ts) {{
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased);
      if (k < 1) requestAnimationFrame(tick);
    }}
    requestAnimationFrame(tick);
  }}
  if ('IntersectionObserver' in window && !reduce) {{
    Array.prototype.forEach.call(counters, function (el) {{ el.dataset.count = el.textContent; el.textContent = '0'; }});
    var co = new IntersectionObserver(function (entries) {{
      entries.forEach(function (e) {{ if (e.isIntersecting) {{ count(e.target); co.unobserve(e.target); }} }});
    }}, {{ threshold: 0.6 }});
    Array.prototype.forEach.call(counters, function (el) {{ co.observe(el); }});
  }}

  /* ---------- funding: each amount counts up in its own currency when it comes into view ---------- */
  var amounts = document.querySelectorAll('.fund-amount');
  if (amounts.length && !reduce && 'IntersectionObserver' in window) {{
    var ao = new IntersectionObserver(function (entries) {{
      entries.forEach(function (x) {{
        if (!x.isIntersecting) return;
        ao.unobserve(x.target);
        var el = x.target, m = /^([^0-9]*)([0-9,]+)(.*)$/.exec(el.getAttribute('data-final'));
        if (!m) return;
        var target = parseInt(m[2].replace(/,/g, ''), 10), t0 = null;
        (function step(ts) {{
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1600), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
          el.textContent = m[1] + v.toLocaleString('en-US') + m[3];
          if (k < 1) requestAnimationFrame(step);
          else if (el.closest('.fund')) el.closest('.fund').classList.add('counted');   // the medal answers
        }})(performance.now());
      }});
    }}, {{ threshold: 0.6 }});
    Array.prototype.forEach.call(amounts, function (el) {{
      var final = el.textContent, m = /^([^0-9]*)([0-9,]+)(.*)$/.exec(final);
      el.setAttribute('data-final', final);
      if (m) el.textContent = m[1] + '0' + m[3];
      ao.observe(el);
    }});
  }}

  /* ---------- opening reveal: lift the curtain, then let the page animations run ---------- */
  if (document.documentElement.classList.contains('intro-on')) {{
    var endIntro = function () {{ document.documentElement.classList.remove('intro-on'); }};
    setTimeout(endIntro, 2150);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {{ window.addEventListener(ev, endIntro, {{ once: true, passive: true }}); }});
  }}

  /* ---------- magnetic buttons: they lean gently towards the pointer ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {{
    Array.prototype.forEach.call(document.querySelectorAll('.btn, .button, .pub-more'), function (b) {{
      b.addEventListener('mousemove', function (e) {{
        var r = b.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        b.style.transform = 'translate(' + (x * 10).toFixed(1) + 'px,' + (y * 7).toFixed(1) + 'px)';
      }});
      b.addEventListener('mouseleave', function () {{ b.style.transform = ''; }});
    }});
  }}

  /* ---------- hero parallax: text and detector drift apart as the page scrolls ---------- */
  var heroEl = document.querySelector('.hero'), heroText = heroEl && heroEl.querySelector('.hero-text'),
      heroField = heroEl && !heroEl.hasAttribute('data-scene') && heroEl.querySelector('.field');
  function parallax() {{
    if (reduce || !heroEl) return;
    var y = window.scrollY, h = heroEl.offsetHeight;
    if (y > h) return;
    if (heroText) {{ heroText.style.transform = 'translateY(' + (y * 0.2).toFixed(1) + 'px)'; heroText.style.opacity = (1 - 0.85 * y / h).toFixed(3); }}
    if (heroField) heroField.style.transform = 'translateY(' + (y * 0.38).toFixed(1) + 'px)';
  }}
  window.addEventListener('scroll', parallax, {{ passive: true }});

  /* ---------- dark mode: follows the system until the reader chooses, then remembers the choice ---------- */
  var root = document.documentElement, tbtns = document.querySelectorAll('.theme-toggle');
  function mark(dark) {{
    Array.prototype.forEach.call(tbtns, function (b) {{
      b.setAttribute('aria-pressed', dark ? 'true' : 'false'); b.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }});
  }}
  function setTheme(dark, save) {{
    if (dark) root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    mark(dark);
    if (save) {{ try {{ localStorage.setItem('sb-theme', dark ? 'dark' : 'light'); }} catch (e) {{}} }}
    document.dispatchEvent(new CustomEvent('themechange', {{ detail: {{ dark: dark }} }}));
  }}
  mark(root.getAttribute('data-theme') === 'dark');
  try {{                                             // a soft pulse shows where the switch is, once per visit, until a theme is chosen
    if (!reduce && !localStorage.getItem('sb-theme') && !sessionStorage.getItem('sb-tt-hint')) {{
      Array.prototype.forEach.call(tbtns, function (b) {{ b.classList.add('hint'); }}); sessionStorage.setItem('sb-tt-hint', '1');
    }}
  }} catch (e) {{}}
  Array.prototype.forEach.call(tbtns, function (tbtn) {{
    tbtn.addEventListener('click', function () {{
      var dark = root.getAttribute('data-theme') !== 'dark';
      if (reduce || !document.startViewTransition) {{ setTheme(dark, true); return; }}
      var r = tbtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.classList.add('theme-vt');
      var vt = document.startViewTransition(function () {{ setTheme(dark, true); }});
      vt.ready.then(function () {{
        root.animate({{ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] }},
                     {{ duration: 650, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }});
      }}).catch(function () {{}});
      vt.finished.then(function () {{ root.classList.remove('theme-vt'); }}, function () {{ root.classList.remove('theme-vt'); }});
    }});
  }});
  var corner = document.querySelector('.theme-toggle.corner'), navbar = document.querySelector('.navbar'),
      cornerFind = document.querySelector('.ss-btn.corner');
  if (corner && navbar) {{                           // the corner switches step aside as the menu bar with its own reaches them
    var edge = 0, queued = false;                     // where the corner buttons end (measured once per size, not on every scroll)
    var measure = function () {{ edge = corner.offsetTop + corner.offsetHeight + 8; }};
    var place = function () {{
      queued = false;
      var away = navbar.getBoundingClientRect().top <= edge;
      corner.classList.toggle('away', away);
      if (cornerFind) cornerFind.classList.toggle('away', away);
    }};
    window.addEventListener('scroll', function () {{ if (!queued) {{ queued = true; requestAnimationFrame(place); }} }}, {{ passive: true }});
    window.addEventListener('resize', function () {{ measure(); place(); }});
    requestAnimationFrame(function () {{ measure(); place(); }});   // after the first layout, so as not to force one
  }}
  var dq = window.matchMedia('(prefers-color-scheme: dark)'), follow = function (ev) {{
    var saved = null; try {{ saved = localStorage.getItem('sb-theme'); }} catch (e) {{}}
    if (!saved) setTheme(ev.matches, false);
  }};
  if (dq.addEventListener) dq.addEventListener('change', follow); else if (dq.addListener) dq.addListener(follow);

  /* ---------- pause every animation: the canvases, the ticker, the journey map (kept on every page) ---------- */
  var mtBtns = document.querySelectorAll('.motion-toggle');
  var setStill = function (on, save) {{
    root.classList.toggle('still', on);
    Array.prototype.forEach.call(mtBtns, function (b) {{
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Play the animations' : 'Pause the animations');
      b.title = on ? 'Play the animations again' : 'Pause the animations on every page';
    }});
    var jsvg = document.querySelector('.journey-map svg');
    if (jsvg && jsvg.pauseAnimations) {{ if (on) jsvg.pauseAnimations(); else jsvg.unpauseAnimations(); }}
    if (save) {{ try {{ if (on) localStorage.setItem('sb-still', '1'); else localStorage.removeItem('sb-still'); }} catch (e) {{}} }}
    if (window.CustomEvent) document.dispatchEvent(new CustomEvent('motionchange', {{ detail: {{ still: on }} }}));
  }};
  Array.prototype.forEach.call(mtBtns, function (b) {{ b.addEventListener('click', function () {{ setStill(!root.classList.contains('still'), true); }}); }});
  if (mtBtns.length) document.addEventListener('keydown', function (ev) {{   // P pauses or plays them from the keyboard
    var t = ev.target;
    if ((ev.key !== 'p' && ev.key !== 'P') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if ((t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) || document.querySelector('dialog[open]')) return;
    if (getComputedStyle(mtBtns[0]).display === 'none') return;      // (not with reduced motion, where nothing moves)
    ev.preventDefault(); setStill(!root.classList.contains('still'), true);
  }});
  if (root.classList.contains('still')) requestAnimationFrame(function () {{ setStill(true, false); }});

  /* ---------- progress bar, back-to-top, current page in the menu ---------- */
  var nav = document.querySelector('.navbar nav'), here = nav && nav.querySelector('.here');
  requestAnimationFrame(function () {{               // after the first layout, so that reading the sizes forces none
    if (nav && here && getComputedStyle(nav).overflowX === 'auto' && nav.scrollWidth > nav.clientWidth + 2) {{
      nav.scrollLeft = Math.max(0, here.offsetLeft - 24);
    }}
  }});
  /* ---------- the menu's dropdowns on touch screens (iPad and phone): a tap opens one (the page itself
     comes first in it), a second tap on the same item goes to the page, a tap anywhere else closes it ---------- */
  var touchNav = window.matchMedia('(hover: none)'), bar0 = document.querySelector('.navbar');
  var navItems = Array.prototype.slice.call(document.querySelectorAll('.navbar .nav-item'));
  function closeDrops(keep) {{
    navItems.forEach(function (it) {{ if (it !== keep) it.classList.remove('open'); }});
    if (nav) nav.classList.toggle('has-open', !!keep);       // the faded edges of a phone's menu would hide the panel
  }}
  function placeDrop(it) {{
    var a = it.firstElementChild, d = a.nextElementSibling, r = a.getBoundingClientRect(), b = bar0.getBoundingClientRect();
    d.style.top = Math.round(b.bottom - 1) + 'px';
    d.style.left = Math.round(Math.max(8, Math.min(r.left - 6, window.innerWidth - d.offsetWidth - 8))) + 'px';
  }}
  navItems.forEach(function (it) {{
    var a = it.firstElementChild;
    if (!a || !a.nextElementSibling) return;
    a.addEventListener('click', function (ev) {{
      if (!touchNav.matches || it.classList.contains('open')) return;     // a second tap goes to the page
      ev.preventDefault(); closeDrops(it); it.classList.add('open'); placeDrop(it);
    }});
  }});
  document.addEventListener('click', function (ev) {{ if (!(ev.target.closest && ev.target.closest('.nav-item'))) closeDrops(null); }});
  document.addEventListener('keydown', function (ev) {{ if (ev.key === 'Escape') closeDrops(null); }});
  window.addEventListener('scroll', function () {{ var o = document.querySelector('.nav-item.open'); if (o) placeDrop(o); }}, {{ passive: true }});
  window.addEventListener('resize', function () {{ closeDrops(null); }});
  if (nav) nav.addEventListener('scroll', function () {{ var o = document.querySelector('.nav-item.open'); if (o) placeDrop(o); }}, {{ passive: true }});

  if (nav) {{                                       // a menu that scrolls sideways fades out at the edge with more beyond it
    var edges = function () {{
      var max = getComputedStyle(nav).overflowX === 'auto' ? nav.scrollWidth - nav.clientWidth : 0;
      nav.classList.toggle('fade-l', max > 2 && nav.scrollLeft > 2);
      nav.classList.toggle('fade-r', max > 2 && nav.scrollLeft < max - 2);
    }};
    nav.addEventListener('scroll', edges, {{ passive: true }}); window.addEventListener('resize', edges); requestAnimationFrame(edges);
  }}
  var bar = document.querySelector('.progress'), top = document.querySelector('.to-top'), foot = document.querySelector('footer'), cue = document.querySelector('.scroll-cue');
  function update() {{
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    var atFoot = foot && foot.getBoundingClientRect().top < window.innerHeight;   // the footer has its own link up
    if (top) top.classList.toggle('show', window.scrollY > window.innerHeight * 0.9 && !atFoot);
    if (cue) cue.classList.toggle('gone', window.scrollY > 60);      // the scroll cue steps aside once the reader scrolls
  }}
  var upNext = false, later = function () {{ if (!upNext) {{ upNext = true; requestAnimationFrame(function () {{ upNext = false; update(); }}); }} }};
  window.addEventListener('scroll', later, {{ passive: true }});   // once a frame at most, and never before the first layout
  window.addEventListener('resize', later);
  later();

  /* ---------- search the whole site: "/" (or Ctrl K) on any page, or the magnifier in the menu bar ---------- */
  var ss = document.querySelector('dialog.ss[data-src]');
  if (ss && ss.showModal && window.fetch) {{
    var ssq = ss.querySelector('.ss-input'), ssl = ss.querySelector('.ss-list'), sst = ss.querySelector('.ss-status'),
        ssh = ss.querySelector('.ss-hints'), ssIndex = null, ssAct = -1, ssHits = [], ssVocab = {{}}, ssAsTyped = false,
        ssFixNote = ss.querySelector('.ss-fix');
    var ssEdits = function (a, b, most) {{             // how many letters to change, give up beyond "most"
      if (Math.abs(a.length - b.length) > most) return most + 1;
      var prev = [], cur, i, j;
      for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) {{
        cur = [i]; var low = i;
        for (j = 1; j <= b.length; j++) {{
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
          if (cur[j] < low) low = cur[j];
        }}
        if (low > most) return most + 1;
        prev = cur;
      }}
      return prev[b.length];
    }};
    var ssFound = function (w) {{
      for (var i = 0; i < ssIndex.length; i++) {{ var e = ssIndex[i]; if (e.ft.indexOf(w) >= 0 || e.fs.indexOf(w) >= 0 || e.fb.indexOf(w) >= 0) return true; }}
      return false;
    }};
    var ssFix = function (w) {{                        // a word found nowhere: the nearest word of the site, if it is a typo away
      if (w.length < 4 || ssFound(w)) return w;
      var most = w.length >= 7 ? 2 : 1, best = w, bd = most + 1, bn = 0;
      Object.keys(ssVocab).forEach(function (v) {{
        var d = ssEdits(w, v, most);
        if (d < bd || (d === bd && d <= most && ssVocab[v] > bn)) {{ bd = d; best = v; bn = ssVocab[v]; }}
      }});
      return bd <= most ? best : w;
    }};
    var fold = function (x) {{                       // Zurich finds Zürich, and Mellin Barnes finds Mellin-Barnes
      return (x || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[-\\u2010\\u2011_]/g, ' ');
    }};
    var ssLoad = function () {{
      if (ssIndex) return Promise.resolve(ssIndex);
      return fetch(ss.dataset.src).then(function (r) {{ return r.json(); }}).then(function (d) {{
        d.forEach(function (e) {{
          e.ft = fold(e.t); e.fs = fold(e.s + ' ' + e.k + ' ' + e.y); e.fb = fold(e.b);
          (e.ft + ' ' + e.fs + ' ' + e.fb).split(/[^a-z0-9]+/).forEach(function (w) {{ if (w.length > 3) ssVocab[w] = (ssVocab[w] || 0) + 1; }});
        }});
        return (ssIndex = d);
      }});
    }};
    var atWord = function (txt, at) {{ return at === 0 || !/[a-z0-9]/.test(txt.charAt(at - 1)); }};
    var ssScore = function (e, words) {{                // every word must be found: in the title counts most, then the line under it, then the text
      var total = 0;
      for (var i = 0; i < words.length; i++) {{
        var w = words[i], at, sc = 0;
        if ((at = e.ft.indexOf(w)) >= 0) sc = atWord(e.ft, at) ? 8 : 5;
        else if ((at = e.fs.indexOf(w)) >= 0) sc = atWord(e.fs, at) ? 4 : 2;
        else if (e.fb.indexOf(w) >= 0) sc = 1;
        if (!sc) return 0;
        total += sc;
      }}
      var ph = words.join(' ');                         // the words together, as written, count extra
      if (words.length > 1) total += e.ft.indexOf(ph) >= 0 ? 6 : e.fs.indexOf(ph) >= 0 ? 3 : e.fb.indexOf(ph) >= 0 ? 2 : 0;
      return total + (e.k === 'Page' ? 1 : 0);
    }};
    var ssLine = function (e, words) {{                 // found only in an abstract: show the words around it
      var tries = words.length > 1 ? [words.join(' ')].concat(words) : words;
      for (var i = 0; i < tries.length; i++) {{
        if (e.ft.indexOf(tries[i]) >= 0 || e.fs.indexOf(tries[i]) >= 0) {{ if (i === 0 && tries.length > 1) return e.s; continue; }}
        var at = e.fb.indexOf(tries[i]);
        if (at < 0) continue;
        var a = at > 60 ? e.b.indexOf(' ', at - 60) + 1 : 0, z = e.b.indexOf(' ', Math.min(e.b.length, at + 90));
        return (a > 0 ? '…' : '') + e.b.slice(a, z < 0 ? e.b.length : z) + (z < 0 ? '' : '…');
      }}
      return e.s;
    }};
    var ssMark = function (i, scroll) {{
      ssAct = i;
      Array.prototype.forEach.call(ssl.children, function (li, k) {{ li.setAttribute('aria-selected', k === i ? 'true' : 'false'); }});
      if (i >= 0) {{ ssq.setAttribute('aria-activedescendant', 'ss-o' + i); if (scroll) ssl.children[i].scrollIntoView({{ block: 'nearest' }}); }}
      else ssq.removeAttribute('aria-activedescendant');
    }};
    var ssShow = function () {{
      var typed = fold(ssq.value).split(/[\\s,]+/).filter(Boolean), words = ssAsTyped ? typed : typed.map(ssFix);
      var fixed = words.join(' ') !== typed.join(' ');
      ssFixNote.hidden = !fixed;
      if (fixed) {{ ssFixNote.querySelector('.ss-fixed').textContent = words.join(' '); ssFixNote.querySelector('.ss-orig span').textContent = ssq.value.trim(); }}
      ssHits = !words.length ? [] : ssIndex.map(function (e) {{ return [ssScore(e, words), e]; }})
        .filter(function (x) {{ return x[0] > 0; }})
        .sort(function (a, b) {{ return b[0] - a[0] || (+b[1].y || 0) - (+a[1].y || 0); }})
        .slice(0, 12).map(function (x) {{ return x[1]; }});
      ssl.textContent = '';
      ssHits.forEach(function (e, i) {{
        var li = document.createElement('li'), a = document.createElement('a');
        li.id = 'ss-o' + i; li.setAttribute('role', 'option'); li.style.setProperty('--k', i);
        a.href = e.u; a.tabIndex = -1;
        [['ss-k', e.k + (e.y ? ' · ' + e.y : '')], ['ss-t', e.t, e.h], ['ss-s', ssLine(e, words)]].forEach(function (p) {{
          var sp = document.createElement('span'); sp.className = p[0];
          if (p[2]) sp.innerHTML = p[2]; else sp.textContent = p[1];   // the index is the site's own, written by build.py
          a.appendChild(sp);
        }});
        li.appendChild(a); ssl.appendChild(li);
      }});
      ssh.hidden = words.length > 0;
      sst.textContent = !words.length ? '' : ssHits.length ? ssHits.length + (ssHits.length === 1 ? ' result' : (ssHits.length === 12 ? ' best results' : ' results'))
                                                           : 'Nothing found. Try fewer or shorter words.';
      ssq.setAttribute('aria-expanded', ssHits.length ? 'true' : 'false');
      ssMark(ssHits.length ? 0 : -1, true);
    }};
    var ssGo = function (e) {{
      var u = new URL(e.u, location.href), page = function (p) {{ return p.replace(/\\/$/, '/index.html'); }};
      if (page(u.pathname) !== page(location.pathname) || (u.search && u.search !== location.search)) {{ location.href = u.href; return; }}
      ss.close();                                     // a part of this page: open it and bring it into view
      if (u.hash && u.hash !== location.hash) {{ location.hash = u.hash; return; }}
      var el = u.hash ? document.getElementById(decodeURIComponent(u.hash.slice(1))) : document.body;
      toTarget();
      if (el) el.scrollIntoView({{ block: 'start', behavior: reduce ? 'auto' : 'smooth' }});
    }};
    var ssOpen = function () {{
      if (ss.open) return;
      ss.showModal(); ssq.focus(); ssq.select();
      ssLoad().then(ssShow).catch(function () {{ sst.textContent = 'The search could not load. Please try again.'; }});
    }};
    Array.prototype.forEach.call(document.querySelectorAll('.ss-btn'), function (b) {{ b.addEventListener('click', ssOpen); }});
    document.addEventListener('keydown', function (ev) {{
      var t = ev.target, typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
      if ((ev.key === '/' && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey) || ((ev.metaKey || ev.ctrlKey) && /^k$/i.test(ev.key))) {{
        ev.preventDefault(); ssOpen();
      }}
    }});
    ssq.addEventListener('input', function () {{ ssAsTyped = false; if (ssIndex) ssShow(); }});
    ss.querySelector('.ss-orig').addEventListener('click', function () {{ ssAsTyped = true; ssShow(); ssq.focus(); }});
    ssq.addEventListener('keydown', function (ev) {{
      if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && ssHits.length) {{
        ev.preventDefault();
        ssMark((ssAct + (ev.key === 'ArrowDown' ? 1 : ssHits.length - 1)) % ssHits.length, true);
      }} else if (ev.key === 'Enter') {{
        ev.preventDefault();
        if (ssAct >= 0) ssGo(ssHits[ssAct]);
      }}
    }});
    ssl.addEventListener('click', function (ev) {{
      var a = ev.target.closest('a'); if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      ev.preventDefault(); ssGo(ssHits[Array.prototype.indexOf.call(ssl.children, a.parentNode)]);
    }});
    ssl.addEventListener('mousemove', function (ev) {{
      var li = ev.target.closest('li'), i = li ? Array.prototype.indexOf.call(ssl.children, li) : -1;
      if (i >= 0 && i !== ssAct) ssMark(i, false);
    }});
    ssh.addEventListener('click', function (ev) {{
      var b = ev.target.closest('button'); if (!b) return;
      ssq.value = b.textContent; ssq.focus(); if (ssIndex) ssShow();
    }});
    Array.prototype.forEach.call(document.querySelectorAll('[data-ss]'), function (b) {{   // a topic on the page: everything about it, at once
      b.addEventListener('click', function () {{ ssOpen(); ssq.value = b.dataset.ss; ssAsTyped = false; if (ssIndex) ssShow(); }});
    }});
    ss.querySelector('.ss-close').addEventListener('click', function () {{ ss.close(); }});
    ss.addEventListener('click', function (ev) {{ if (ev.target === ss) ss.close(); }});   // a click outside the box
  }}
  var kh = document.querySelector('dialog.keys-help');                 // "?": the keyboard shortcuts
  if (kh && kh.showModal) {{
    document.addEventListener('keydown', function (ev) {{
      var t = ev.target, typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
      if (ev.key === '?' && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !document.querySelector('dialog[open]')) {{ ev.preventDefault(); kh.showModal(); }}
    }});
    kh.querySelector('.kh-close').addEventListener('click', function () {{ kh.close(); }});
    kh.addEventListener('click', function (ev) {{ if (ev.target === kh) kh.close(); }});
  }}

  /* ---------- talks: a click on a city of the map shows its talks in the list below ---------- */
  var tchip = document.querySelector('.talk-chip');
  if (tchip) {{
    var trows = document.querySelectorAll('#talks .talk-card, #talks .entry[data-city]'),
        tcards = document.querySelector('#talks .talk-cards'), tearly = document.getElementById('earlier-talks');
    var tcities = null, tinv = false, tinvBtn = document.querySelector('.talk-inv');
    var tshow = function (cities) {{ tcities = cities || null; tapply(true); }};
    var tapply = function (fromCity) {{
      var cities = tcities, narrow = !!cities || tinv;
      var n = 0, inCards = 0, inEarly = 0, wasOpen = tearly && tearly.open;   // (rows of a list that opens now unfold by themselves)
      Array.prototype.forEach.call(trows, function (r) {{
        var ok = (!cities || cities.indexOf(r.dataset.city) >= 0) && (!tinv || r.dataset.inv === '1');
        r.classList.toggle('tf-out', !ok);
        if (ok) {{
          n++; if (tearly && tearly.contains(r)) inEarly++; else inCards++;
          if (narrow && !reduce && r.animate && (wasOpen || !(tearly && tearly.contains(r))))   // they come in one after another
            r.animate([{{ opacity: 0, transform: 'translateY(8px)' }}, {{ opacity: 1, transform: 'none' }}],
                      {{ duration: 420, delay: Math.min(n - 1, 12) * 45, easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'backwards' }});
        }}
      }});
      if (tcards) tcards.classList.toggle('tf-out', narrow && !inCards);
      if (tearly) {{
        var sum = tearly.querySelector('summary');
        if (!sum.dataset.all) sum.dataset.all = sum.textContent;   // "Show 25 earlier talks", or as many as the city has
        sum.textContent = narrow ? 'Show ' + inEarly + (inEarly === 1 ? ' earlier talk' : ' earlier talks') : sum.dataset.all;
        tearly.classList.toggle('tf-out', narrow && !inEarly);
        if (cities && inEarly) {{ tearly.classList.add('instant'); tearly.open = true; setTimeout(function () {{ tearly.classList.remove('instant'); }}, 800); }}
      }}
      tchip.hidden = !cities;
      if (fromCity && window.CustomEvent) document.dispatchEvent(new CustomEvent('talkcity-shown', {{ detail: {{ cities: cities }} }}));   // the map rings them
      if (cities) {{
        tchip.querySelector('.dc-n').textContent = cities.length > 1 ? cities.slice(0, -1).join(', ') + ' and ' + cities[cities.length - 1] : cities[0];
        tchip.querySelector('.tf-n').textContent = '· ' + (tinv ? (n ? n + (n === 1 ? ' invited talk' : ' invited talks') : 'no invited talks')
                                                             : n + (n === 1 ? ' talk' : ' talks'));
      }}
    }};
    document.addEventListener('talkcity', function (ev) {{
      tshow(ev.detail && ev.detail.cities);
      tchip.scrollIntoView({{ block: 'start', behavior: reduce ? 'auto' : 'smooth' }});
    }});
    tchip.querySelector('.dc-x').addEventListener('click', function () {{ tshow(null); }});
    if (tinvBtn) tinvBtn.addEventListener('click', function () {{   // the invited talks only (with the city, if one is chosen)
      tinv = !tinv; tinvBtn.setAttribute('aria-pressed', tinv ? 'true' : 'false'); tapply(false);
      if (window.CustomEvent) document.dispatchEvent(new CustomEvent('talkinvited', {{ detail: {{ on: tinv }} }}));   // the map dims the rest
    }});
  }}

  /* ---------- journey map: a dot travels the route once the arcs are drawn ---------- */
  var jm = document.querySelector('.journey-map'), trav = jm && jm.querySelector('.jm-traveler');
  if (trav && !reduce) {{
    var NS = 'http://www.w3.org/2000/svg';
    var motion = document.createElementNS(NS, 'animateMotion');
    motion.setAttribute('dur', '7.5s'); motion.setAttribute('repeatCount', 'indefinite');
    var mp = document.createElementNS(NS, 'mpath');
    mp.setAttribute('href', '#jm-route'); mp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#jm-route');
    motion.appendChild(mp);
    var fade = document.createElementNS(NS, 'animate');
    fade.setAttribute('attributeName', 'opacity'); fade.setAttribute('values', '0;1;1;0');
    fade.setAttribute('keyTimes', '0;0.06;0.92;1'); fade.setAttribute('dur', '7.5s'); fade.setAttribute('repeatCount', 'indefinite');
    trav.appendChild(motion); trav.appendChild(fade);
    function live() {{ jm.classList.add('live'); }}
    if ('IntersectionObserver' in window) {{
      var mo = new IntersectionObserver(function (en) {{
        if (en[0].isIntersecting) {{ setTimeout(live, 5200); mo.disconnect(); }}
      }}, {{ threshold: 0.3 }});
      mo.observe(jm);
    }} else {{ live(); }}
  }}

  /* ---------- portrait: gentle 3D tilt under the mouse ---------- */
  var pf = document.querySelector('.portrait-frame');
  if (pf && !reduce && window.matchMedia('(hover: hover)').matches) {{
    pf.addEventListener('mousemove', function (e) {{
      var r = pf.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      pf.style.transform = 'perspective(900px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 9).toFixed(2) + 'deg)';
    }});
    pf.addEventListener('mouseleave', function () {{ pf.style.transform = ''; }});
  }}

  /* ---------- hero: collider event display ----------
     A detector cross-section: beam pipe, tracker, electromagnetic and hadronic
     calorimeters, muon chambers. Real processes play in turn, each particle drawn
     with its conventional line: quarks and charged hadrons as solid tracks bent by
     the solenoid field, gluons as curls that shower into jets, photons as waves,
     electrons in crimson, muons reaching the outer chambers, neutrinos as a dotted
     missing-momentum arrow, and b jets from displaced secondary vertices. */
  var hero = document.querySelector('.hero:not([data-scene])'), cv = hero && hero.querySelector('.field');
  var stage = hero && hero.querySelector('.hero-stage');
  var evLabels = hero ? hero.querySelectorAll('.ev-label') : [], evSays = hero ? hero.querySelectorAll('.ev-say') : [];
  if (cv && cv.getContext) {{
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, CX = 0, CY = 0, RO = 200, parts = [], flashAt = -1e9, nextAt = 0, visible = true, raf = null;
    var t0 = performance.now(), TAU = Math.PI * 2, evIndex = 0;
    var COL = {{}}, PAL = {{                       // line colours by day and by night
      light: {{ hadron: 'rgba(168,137,79,', gluon: 'rgba(46,92,78,', photon: 'rgba(122,95,42,', electron: 'rgba(110,44,52,',
               muon: 'rgba(28,53,47,', nu: 'rgba(74,90,102,', pine: 'rgba(46,92,78,' }},
      dark: {{ hadron: 'rgba(201,168,104,', gluon: 'rgba(127,184,163,', photon: 'rgba(214,180,110,', electron: 'rgba(216,132,142,',
              muon: 'rgba(232,226,208,', nu: 'rgba(170,182,186,', pine: 'rgba(127,184,163,' }}
    }};
    function palette() {{ var src = PAL[document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light']; for (var k in src) COL[k] = src[k]; }}
    palette(); document.addEventListener('themechange', palette);
    function size() {{
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stage && stage.offsetWidth) {{
        var p = stage.getBoundingClientRect();
        CX = p.left - r.left + p.width / 2; CY = p.top - r.top + p.height / 2;
        var stacked = window.matchMedia('(max-width: 52rem)').matches;   // phones and tablets: detector above the name
        RO = stacked ? Math.min(p.width * 0.4, p.height * 0.62, 240) : Math.min(p.width * 0.6, H * 0.44);
        var out = stacked ? Math.max(0, Math.round(CY + RO + 14 - (p.top - r.top + p.height))) : 0;   // how far the rings reach below the stage
        if (out !== overhang) {{                        // the caption under the detector starts below the rings
          overhang = out; stage.style.setProperty('--ro-out', out + 'px'); requestAnimationFrame(size);
        }}
      }} else {{ CX = W * 0.72; CY = H / 2; RO = Math.min(W, H) * 0.38; }}
    }}
    var overhang = -1;
    function rnd(a, b) {{ return a + Math.random() * (b - a); }}
    function sign() {{ return Math.random() < 0.5 ? -1 : 1; }}

    /* particle factories: angles in radians, curvature radii in units of RO */
    function hadron(phi, o) {{
      o = o || {{}};
      return {{ kind: 'hadron', phi: phi, q: sign(), rc: RO * (o.rc || rnd(0.8, 6)), ox: o.ox || 0, oy: o.oy || 0,
               delay: o.delay || 0, e: rnd(0.2, 0.8) }};
    }}
    function jet(phi, n, o) {{                       // a parton that showers into charged hadrons
      o = o || {{}};
      var list = [], len = RO * (o.len || 0.2), sx, sy;
      if (o.gluon === false) {{ sx = o.ox || 0; sy = o.oy || 0; }}
      else {{ list.push({{ kind: 'gluon', phi: phi, len: len, delay: 0 }}); sx = Math.cos(phi) * len; sy = Math.sin(phi) * len; }}
      for (var i = 0; i < n; i++) {{
        list.push(hadron(phi + rnd(-0.24, 0.24), {{ ox: sx, oy: sy, rc: rnd(1.5, 9), delay: o.gluon === false ? 0 : 0.3 }}));
      }}
      return list;
    }}
    function photon(phi) {{ return {{ kind: 'photon', phi: phi, e: rnd(0.75, 1), delay: 0 }}; }}
    function electron(phi, q) {{ return {{ kind: 'electron', phi: phi, q: q, rc: RO * rnd(3, 8), e: rnd(0.75, 1), delay: 0, ox: 0, oy: 0 }}; }}
    function muon(phi, q) {{ return {{ kind: 'muon', phi: phi, q: q, rc: RO * rnd(5, 12), delay: 0, ox: 0, oy: 0 }}; }}
    function neutrino(phi) {{ return {{ kind: 'nu', phi: phi, delay: 0.2 }}; }}
    function soft(n) {{                                // the rest of the collision: soft, curling tracks
      var l = [];
      for (var i = 0; i < n; i++) l.push(hadron(rnd(0, TAU), {{ rc: rnd(0.12, 0.9) }}));
      return l;
    }}
    var EVENTS = [
      {{ label: 'H → γγ', say: 'A Higgs boson decays into two photons', make: function () {{
          var a = rnd(0, TAU); return [photon(a), photon(a + Math.PI + rnd(-0.3, 0.3))].concat(soft(9)); }} }},
      {{ label: 'Z → μ⁺μ⁻', say: 'A Z boson decays into two muons', make: function () {{
          var a = rnd(0, TAU); return [muon(a, 1), muon(a + Math.PI + rnd(-0.25, 0.25), -1)].concat(soft(10)); }} }},
      {{ label: 'pp → gg → two jets', say: 'Two gluons scatter into two jets of particles', make: function () {{
          var a = rnd(0, TAU); return jet(a, 9).concat(jet(a + Math.PI + rnd(-0.2, 0.2), 8), soft(6)); }} }},
      {{ label: 'W → eν', say: 'A W boson decays into an electron and an unseen neutrino', make: function () {{
          var a = rnd(0, TAU); return [electron(a, sign()), neutrino(a + Math.PI + rnd(-0.3, 0.3))].concat(soft(10)); }} }},
      {{ label: 't<span class="ov">t</span> → b <span class="ov">b</span> μ ν + jets', say: 'A pair of top quarks decays into jets, a muon and a neutrino', make: function () {{
          var l = [], a = rnd(0, TAU);
          [a, a + 2.3].forEach(function (p) {{          // two b jets from displaced secondary vertices
            var ox = Math.cos(p) * RO * 0.04, oy = Math.sin(p) * RO * 0.04;
            l.push({{ kind: 'sv', ox: ox, oy: oy, delay: 0 }});
            l = l.concat(jet(p, 5, {{ gluon: false, ox: ox, oy: oy }}));
          }});
          l = l.concat(jet(a + 3.9, 6, {{ len: 0.16 }}), jet(a + 4.6, 5, {{ len: 0.14 }}));
          l.push(muon(a + 1.2, 1), neutrino(a + 0.8));
          return l.concat(soft(5)); }} }},
      {{ label: 'H → ZZ* → 4ℓ', say: 'A Higgs boson decays into four leptons through two Z bosons', make: function () {{
          var a = rnd(0, TAU);
          return [muon(a, 1), muon(a + 2.1, -1), electron(a + 3.3, 1), electron(a + 4.6, -1)].concat(soft(8)); }} }},
      {{ label: 'HH → b<span class="ov">b</span>γγ', say: 'Two Higgs bosons decay into two b quarks and two photons', make: function () {{
          // two Higgs bosons back to back: one gives two photons, the other two b jets from displaced vertices
          var a = rnd(0, TAU), d1 = rnd(0.45, 0.85), d2 = rnd(0.45, 0.85), l = [photon(a - d1), photon(a + d1)];
          [a + Math.PI - d2, a + Math.PI + d2].forEach(function (p) {{
            var ox = Math.cos(p) * RO * 0.04, oy = Math.sin(p) * RO * 0.04;
            l.push({{ kind: 'sv', ox: ox, oy: oy, delay: 0 }});
            l = l.concat(jet(p, 5, {{ gluon: false, ox: ox, oy: oy }}));
          }});
          return l.concat(soft(6)); }} }}
    ];
    if (document.body.classList.contains('page-404')) EVENTS = [   // a missing page: events where something leaves unseen
      {{ label: 'Z → ν<span class="ov">ν</span> + jet', say: 'A Z boson decays into two unseen neutrinos', make: function () {{
          var a = rnd(0, TAU); return jet(a, 9).concat([neutrino(a + Math.PI + rnd(-0.2, 0.2))], soft(6)); }} }},
      EVENTS[3]
    ];
    function spawn(now) {{
      var ev = EVENTS[evIndex++ % EVENTS.length], list = ev.make();
      list.forEach(function (p) {{ p.born = now + (p.delay || 0) * 1000 + rnd(20, 90); }});
      parts = parts.concat(list); flashAt = now;
      Array.prototype.forEach.call(evLabels, function (el) {{ el.classList.remove('on'); void el.offsetWidth; el.innerHTML = ev.label; el.classList.add('on'); }});
      Array.prototype.forEach.call(evSays, function (el) {{ el.classList.remove('on'); void el.offsetWidth; el.textContent = ev.say || ''; el.classList.add('on'); }});
    }}
    function helix(p, s) {{                           // transverse projection of a helix: a circle of radius rc
      if (!p.q) return [p.ox + Math.cos(p.phi) * s, p.oy + Math.sin(p.phi) * s];
      var cx = -Math.sin(p.phi) * p.q * p.rc, cy = Math.cos(p.phi) * p.q * p.rc;
      var a = p.q * s / p.rc, c = Math.cos(a), sn = Math.sin(a);
      return [p.ox + cx - cx * c + cy * sn, p.oy + cy - cx * sn - cy * c];
    }}
    function ring(r, alpha, width) {{
      ctx.lineWidth = width; ctx.strokeStyle = 'rgba(168,137,79,' + alpha + ')';
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, TAU); ctx.stroke();
    }}
    function band(r1, r2, fill) {{
      ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(CX, CY, r2, 0, TAU); ctx.arc(CX, CY, r1, 0, TAU, true); ctx.fill();
    }}
    function tower(ang, r, depth, col, alpha) {{       // a calorimeter deposit: a glowing wedge, deeper for more energy
      var w = 0.034;
      ctx.save(); ctx.shadowColor = col + Math.min(1, alpha * 0.9) + ')'; ctx.shadowBlur = 9;
      ctx.fillStyle = col + (alpha * 0.85) + ')'; ctx.beginPath();
      ctx.arc(CX, CY, r + depth, ang - w, ang + w); ctx.arc(CX, CY, r, ang + w, ang - w, true); ctx.closePath(); ctx.fill();
      ctx.restore();
    }}
    function drawTrack(p, s, reach, r0, col, alpha, width) {{
      ctx.lineWidth = width; ctx.strokeStyle = col + alpha + ')'; ctx.setLineDash([]);
      ctx.shadowColor = col + (p.kind === 'hadron' ? 0 : 0.55 * alpha) + ')'; ctx.shadowBlur = p.kind === 'hadron' ? 0 : 7;
      ctx.beginPath();
      var drawing = false, last = -1, hit = false, d, pt;
      for (d = 0; d <= s; d += 4) {{
        pt = helix(p, d);
        var rr = Math.hypot(pt[0], pt[1]);
        if (rr > reach) {{ hit = true; break; }}
        if (rr < last - 0.5) break;                   // curled back: the track stops inside the tracker
        last = rr;
        if (rr < r0) continue;
        if (!drawing) {{ ctx.moveTo(CX + pt[0], CY + pt[1]); drawing = true; }} else ctx.lineTo(CX + pt[0], CY + pt[1]);
      }}
      ctx.stroke(); ctx.shadowBlur = 0;
      if (!hit) return null;
      var pe = helix(p, Math.max(0, d - 4));
      return Math.atan2(pe[1], pe[0]);
    }}
    function frame(now) {{
      ctx.clearRect(0, 0, W, H);
      var t = (now - t0) / 1000;
      // detector: beam pipe, tracker layers, ECAL and HCAL bands, muon chambers, rotating tick ring
      var fl0 = (now - flashAt) / 1000, pulse = fl0 >= 0 && fl0 < 1.6 ? Math.pow(1 - fl0 / 1.6, 2) : 0;
      var glow = ctx.createRadialGradient(CX, CY, RO * 0.02, CX, CY, RO * 1.08);
      glow.addColorStop(0, 'rgba(220,197,143,' + (0.2 + 0.3 * pulse) + ')');
      glow.addColorStop(0.55, 'rgba(168,137,79,' + (0.07 + 0.08 * pulse) + ')');
      glow.addColorStop(1, COL.pine + '0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(CX, CY, RO * 1.08, 0, TAU); ctx.fill();
      ring(RO * 0.05, 0.45, 1);
      [0.13, 0.19, 0.25, 0.31, 0.37].forEach(function (k) {{ ring(RO * k, 0.16, 0.7); }});
      band(RO * 0.5, RO * 0.6, 'rgba(168,137,79,0.12)');
      band(RO * 0.6, RO * 0.74, COL.pine + '0.09)');
      ring(RO * 0.5, 0.32, 0.9); ring(RO * 0.6, 0.2, 0.7); ring(RO * 0.74, 0.32, 0.9);
      [0.85, 0.92].forEach(function (k) {{ ring(RO * k, 0.2, 0.8); }});
      var spin = reduce ? 0 : t * 0.03;
      ctx.strokeStyle = COL.pine + '0.24)'; ctx.lineWidth = 0.8;
      for (var i = 0; i < 160; i++) {{
        var a = spin + i * TAU / 160, len = i % 20 === 0 ? 12 : (i % 4 === 0 ? 6 : 3);
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a) * RO, CY + Math.sin(a) * RO);
        ctx.lineTo(CX + Math.cos(a) * (RO + len), CY + Math.sin(a) * (RO + len));
        ctx.stroke();
      }}
      if (!reduce && now > nextAt) {{ spawn(now); nextAt = now + 4400; }}
      var fl = (now - flashAt) / 700;                  // interaction flash
      if (fl >= 0 && fl < 1) {{
        var g = ctx.createRadialGradient(CX, CY, 0, CX, CY, RO * 0.16);
        g.addColorStop(0, 'rgba(220,197,143,' + (0.9 * (1 - fl)) + ')'); g.addColorStop(1, 'rgba(220,197,143,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, RO * 0.16, 0, TAU); ctx.fill();
      }}
      var sw = (now - flashAt) / 1300;                  // the shock of the collision runs out through the detector
      if (!reduce && sw >= 0 && sw < 1) {{
        ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(201,167,101,' + (0.55 * (1 - sw)) + ')';
        ctx.beginPath(); ctx.arc(CX, CY, RO * (0.05 + 0.95 * (1 - Math.pow(1 - sw, 3))), 0, TAU); ctx.stroke();
      }}
      ctx.fillStyle = COL.pine + '0.75)'; ctx.beginPath(); ctx.arc(CX, CY, 2.2, 0, TAU); ctx.fill();

      var r0 = RO * 0.05, rE = RO * 0.5, rH = RO * 0.6, rMu = RO * 0.97;
      parts = parts.filter(function (p) {{ return now - p.born < 5400; }});
      parts.forEach(function (p) {{
        var age = (now - p.born) / 1000;
        if (age < 0) return;
        var fade = age < 1.9 ? 1 : Math.max(0, 1 - (age - 1.9) / 3.1);
        var grow = reduce ? 1e9 : age * 720, ang, dx, dy, nx, ny, u, s, k;
        if (p.kind === 'sv') {{                          // displaced secondary vertex
          ctx.lineWidth = 1; ctx.strokeStyle = COL.pine + (0.8 * fade) + ')';
          ctx.beginPath(); ctx.arc(CX + p.ox, CY + p.oy, 3, 0, TAU); ctx.stroke();
        }} else if (p.kind === 'gluon') {{                // curly line
          s = Math.min(p.len, grow); dx = Math.cos(p.phi); dy = Math.sin(p.phi); nx = -dy; ny = dx;
          ctx.lineWidth = 1.1; ctx.strokeStyle = COL.gluon + (0.85 * fade) + ')'; ctx.setLineDash([]);
          ctx.beginPath();
          for (u = 0; u <= s; u += 0.7) {{
            var ph = u * 0.62, along = r0 + u + 3.3 * Math.cos(ph) - 3.3, side = 3.3 * Math.sin(ph);
            var X = CX + dx * along + nx * side, Y = CY + dy * along + ny * side;
            if (u === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
          }}
          ctx.stroke();
        }} else if (p.kind === 'photon') {{               // wavy line, ending in the electromagnetic calorimeter
          s = Math.min(rE - r0, grow); dx = Math.cos(p.phi); dy = Math.sin(p.phi); nx = -dy; ny = dx;
          ctx.lineWidth = 1.4; ctx.strokeStyle = COL.photon + (0.95 * fade) + ')'; ctx.setLineDash([]);
          ctx.shadowColor = 'rgba(201,167,101,' + (0.7 * fade) + ')'; ctx.shadowBlur = 8;
          ctx.beginPath();
          for (u = 0; u <= s; u += 1) {{
            var w = 3 * Math.sin(u * 0.55), X2 = CX + dx * (r0 + u) + nx * w, Y2 = CY + dy * (r0 + u) + ny * w;
            if (u === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2);
          }}
          ctx.stroke(); ctx.shadowBlur = 0;
          if (s >= rE - r0 - 1) tower(p.phi, rE, RO * (0.05 + 0.05 * p.e), COL.photon, 0.75 * fade);
        }} else if (p.kind === 'nu') {{                   // missing transverse momentum: a dotted arrow
          s = Math.min(RO * 0.9, grow); dx = Math.cos(p.phi); dy = Math.sin(p.phi);
          ctx.lineWidth = 1.5; ctx.strokeStyle = COL.nu + (0.8 * fade) + ')'; ctx.setLineDash([1.5, 5]); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(CX + dx * r0, CY + dy * r0); ctx.lineTo(CX + dx * s, CY + dy * s); ctx.stroke();
          ctx.setLineDash([]); ctx.lineCap = 'butt';
          if (s >= RO * 0.9 - 1) {{
            var hx = CX + dx * s, hy = CY + dy * s;
            ctx.fillStyle = COL.nu + (0.8 * fade) + ')'; ctx.beginPath();
            ctx.moveTo(hx + dx * 8, hy + dy * 8);
            ctx.lineTo(hx - dy * 4, hy + dx * 4); ctx.lineTo(hx + dy * 4, hy - dx * 4); ctx.closePath(); ctx.fill();
          }}
        }} else if (p.kind === 'muon') {{                 // punches through everything to the muon chambers
          ang = drawTrack(p, Math.min(rMu * 1.4, grow), rMu, r0, COL.muon, 0.9 * fade, 1.9);
          [0.85, 0.92].forEach(function (kk) {{           // chamber hits
            var dd = 0, q;
            for (; dd < rMu * 1.4 && dd <= grow; dd += 4) {{ q = helix(p, dd); if (Math.hypot(q[0], q[1]) >= RO * kk) break; }}
            if (q && Math.hypot(q[0], q[1]) >= RO * kk) {{
              var aa = Math.atan2(q[1], q[0]);
              ctx.lineWidth = 2; ctx.strokeStyle = COL.muon + (0.7 * fade) + ')';
              ctx.beginPath();
              ctx.moveTo(CX + q[0] - Math.sin(aa) * 5, CY + q[1] + Math.cos(aa) * 5);
              ctx.lineTo(CX + q[0] + Math.sin(aa) * 5, CY + q[1] - Math.cos(aa) * 5);
              ctx.stroke();
            }}
          }});
        }} else if (p.kind === 'electron') {{             // stops in the electromagnetic calorimeter
          ang = drawTrack(p, Math.min(rE * 1.5, grow), rE, r0, COL.electron, 0.9 * fade, 1.4);
          if (ang !== null) tower(ang, rE, RO * (0.06 + 0.04 * p.e), COL.electron, 0.7 * fade);
        }} else {{                                        // charged hadron: deposits in the hadronic calorimeter
          ang = drawTrack(p, Math.min(Math.PI * p.rc, rE * 1.7, grow), rE, r0, COL.hadron, 0.82 * fade, 1.05);
          if (ang !== null) tower(ang, rH, RO * (0.03 + 0.1 * p.e), COL.gluon, 0.55 * fade);
        }}
      }});
      raf = (!reduce && !stillNow() && visible && !document.hidden) ? requestAnimationFrame(frame) : null;
    }}
    function stillNow() {{ return document.documentElement.classList.contains('still'); }}   // paused by the button
    function start() {{ if (!raf && !reduce && !stillNow()) raf = requestAnimationFrame(frame); }}
    size();
    if (reduce) {{ spawn(performance.now() - 1600); frame(performance.now()); }}
    else if (stillNow()) {{ spawn(performance.now() - 1600); frame(performance.now()); }}   // a whole event, held still
    else start();
    document.addEventListener('motionchange', function () {{ if (!stillNow()) {{ nextAt = 0; start(); }} }});
    window.addEventListener('resize', function () {{ size(); if (reduce) frame(performance.now()); }});
    if (stage) stage.addEventListener('click', function () {{
      var now = performance.now();
      if (!reduce && now - flashAt > 1000) {{ spawn(now); nextAt = now + 4400; }}   // one event at a time
    }});
    document.addEventListener('visibilitychange', function () {{ if (!document.hidden && visible) start(); }});
    if ('IntersectionObserver' in window) {{
      new IntersectionObserver(function (en) {{ visible = en[0].isIntersecting; if (visible) start(); }}).observe(hero);
    }}
  }}
}})();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
