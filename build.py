#!/usr/bin/env python3
"""
Builds index.html from the data below.

All site content lives in this file. To update the website:
  1. edit the lists below (add a paper, a talk, ...),
  2. run:  python3 build.py
  3. commit and push index.html (GitHub Pages redeploys automatically).

Inline HTML is allowed in titles (e.g. <sub>, <i>, &gamma;).
"""
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
    "scholar": "https://scholar.google.com/scholar?q=%22Sumit+Banik%22+physics",  # replace with your profile URL
    "arxiv": "https://arxiv.org/search/?query=Banik%2C+Sumit&searchtype=author",  # all 26 preprints
    "github": "https://github.com/SumitBanikGit",
    "linkedin": "https://www.linkedin.com/in/waytosumitbanik",
    "portrait": "assets/portrait.jpg",          # set to None to show a monogram
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
         ref="Eur. Phys. J. Spec. Top. <b>235</b> (2026)",
         arxiv="2512.07727", inspire="3090403"),
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
         title="Correlating EDMs and <i>A</i> → <i>γγ</i> in the 2HDM in light of the diphoton excesses at 95 GeV and 152 GeV",
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
         doi="10.5506/APhysPolBSupp.19.2-A8", inspire="3153391"),
    dict(kind="proceedings", year=2026, topic="pheno",
         title="Indications for new Higgs bosons",
         authors="A. Crivellin, S. Ashanujjaman, S. Banik, S. P. Maharathy, G. Coloretti",
         ref="PoS CORFU2025, 064", venue="Corfu Summer Institute 2025",
         arxiv="2605.04233", doi="10.22323/1.509.0064", inspire="3152377"),
    dict(kind="proceedings", year=2025, topic="pheno",
         title='New Higgses at the electroweak scale and differential <i>t</i><span class="ov"><i>t</i></span> distributions',
         authors="S. Banik, G. Coloretti, A. Crivellin, S. Bhattacharya, B. Mellado",
         ref="PoS DIS2024, 125", venue="DIS 2024",
         doi="10.22323/1.469.0125", inspire="2865718"),
    dict(kind="proceedings", year=2024, topic="fi",
         title="Analytic evaluation of multiple Mellin-Barnes integrals",
         authors="S. Banik, S. Friot",
         ref="PoS LL2024, 039", venue="Loops and Legs 2024",
         arxiv="2407.20120", doi="10.22323/1.467.0039", inspire="2811746"),
    dict(kind="proceedings", year=2024, topic="fi soft",
         title="Automated evaluation of Feynman integrals using GKZ hypergeometric systems",
         authors="B. Ananthanarayan, S. Banik, S. Bera, S. Datta",
         ref="Springer Proc. Phys. <b>304</b>, 124 (2024)", venue="DAE-BRNS HEP Symposium",
         doi="10.1007/978-981-97-0289-3_26", inspire="2809580"),
    dict(kind="proceedings", year=2024, topic="fi",
         title="Geometrical methods for the analytic evaluation of multiple Mellin-Barnes integrals",
         authors="S. Banik, S. Friot",
         ref="Acta Phys. Pol. B Proc. Suppl. <b>17</b>, 2-A12 (2024)", venue="MTTD 2023",
         arxiv="2402.04174", doi="10.5506/APhysPolBSupp.17.2-A12", inspire="2755993"),
    dict(kind="proceedings", year=2023, topic="pheno",
         title="Differential <i>eμbb</i> cross-sections and new Higgses at the electroweak scale",
         authors="S. Banik, G. Coloretti, A. Crivellin, B. Mellado",
         ref="TOP 2023 proceedings", venue="16th Int. Workshop on Top Quark Physics",
         arxiv="2312.01458", inspire="2729959"),

    # ---- thesis
    dict(kind="thesis", year=2022, topic="fi",
         title="On hypergeometric solutions of Feynman integrals using Mellin-Barnes integrals with applications",
         authors="S. Banik",
         ref="PhD thesis, Indian Institute of Science, Bengaluru (2022)",
         inspire="2614373"),
]

# Recent news shown on the front page (newest first; keep ~5).
NEWS = [
    ("2026", "Invited talk at <b>CERN</b>, FCC Precision Calculations Working Group."),
    ("2026", "<b>HyperPrecision</b> published in <i>Computer Physics Communications</i>."),
    ("2026", "Two-loop anomalous dimensions of baryon-number-violating operators in SMEFT published in <i>JHEP</i>."),
    ("2026", "Joined the <b>Fundamental Physics Directorate</b> at SLAC, Stanford as a postdoctoral researcher."),
    ("2025", "Awarded the <b>SNSF Postdoc.Mobility Fellowship</b>."),
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

# Research areas scrolling in the band under the navigation.
TICKER = ["Feynman integrals", "Special functions", "Mellin-Barnes integrals", "Effective field theories",
          "Renormalization group", "Higgs physics", "Collider phenomenology", "Beyond the Standard Model",
          "Computer algebra"]

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
    (2026, "FCC Precision Calculations WG Meeting, CERN", "Geneva",
     "Algorithms for analytic and numerical evaluation of multiple Mellin-Barnes integrals",
     "Invited by J. Gluza and M. Zaro", True),
    (2026, "EPP Theory Seminar, SLAC &amp; Stanford University", "Menlo Park",
     "Geometrical techniques to compute Feynman integrals", "", True),
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


# Small monochrome line icons for the contact row (24x24, drawn in currentColor).
def _svg(body):
    return ('<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
            'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>')

ICONS = {
    "i_mail": _svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
    "i_orcid": _svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 10v6"/><circle cx="8.5" cy="7.6" r=".4" fill="currentColor"/>'
                    '<path d="M11.5 16V8h2a4 4 0 0 1 0 8h-2z"/>'),
    "i_inspire": _svg('<circle cx="12" cy="12" r="1.3" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/>'
                      '<ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/>'
                      '<ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>'),
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

LANGUAGES = [("English", "Professional"), ("Bengali", "Native"), ("Hindi", "Fluent"), ("German", "Beginner")]

# ==========================================================================
# Rendering
# ==========================================================================

def authors_html(s):
    parts = [a.strip() for a in s.split(",")]
    keep = lambda a: a.replace(" ", "&nbsp;")          # "S. Banik" never splits across lines
    return ", ".join(f'<span class="me">{keep(a)}</span>' if a == ME else keep(a) for a in parts)


TOPIC_LABEL = {"fi": "Feynman integrals", "pheno": "Phenomenology", "soft": "Software"}


def pub_entry(n, p):
    links = []
    if p.get("arxiv"):
        links.append(f'<a href="https://arxiv.org/abs/{p["arxiv"]}">arXiv:{p["arxiv"]}</a>')
    if p.get("doi"):
        links.append(f'<a href="https://doi.org/{p["doi"]}">DOI</a>')
    if p.get("inspire"):
        links.append(f'<a href="https://inspirehep.net/literature/{p["inspire"]}">INSPIRE</a>')
    if p.get("code"):
        links.append(f'<a href="{p["code"]}">Code</a>')
    venue = f' <span class="sep">·</span> {p["venue"]}' if p.get("venue") else ""
    tags = "".join(f'<span class="tag {t}">{TOPIC_LABEL[t]}</span>' for t in p["topic"].split())
    links.append(f'<span class="tags">{tags}</span>')
    return (
        f'<div class="entry pub" data-topic="{p["topic"]}">'
        f'<div class="rail">[{n}]<br>{p["year"]}</div><div class="body">'
        f'<span class="title">{p["title"]}</span>'
        f'<div class="meta">{authors_html(p["authors"])}</div>'
        f'<div class="detail"><span class="muted">{p["ref"]}</span>{venue}</div>'
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
    return "\n".join(out)


def render_journey():
    out = []
    last = len(JOURNEY) - 1
    for i, (year, city, role, inst, logos) in enumerate(JOURNEY):
        imgs = "".join(f'<img src="assets/logos/{f}.png?v={_ver(f"assets/logos/{f}.png")}" alt="{alt}" loading="lazy">'
                       for f, alt in logos)
        now = ' now' if i == last else ''
        badge = '<span class="j-now">Now</span>' if i == last else ''
        out.append(
            f'<li class="stop{now}" style="--i:{i}"><div class="stop-node n{len(logos)}">{imgs}</div>'
            f'<div class="stop-year">{year}{badge}</div><div class="stop-city">{city}</div>'
            f'<div class="stop-role">{role}</div><div class="stop-inst">{inst}</div></li>')
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


def render_news():
    return "\n".join(f'<li><span class="when">{y}</span><span>{txt}</span></li>' for y, txt in NEWS)


def render_selected():
    return "\n".join(
        f'<a class="pick {topic}" href="https://arxiv.org/abs/{arx}">'
        f'<span class="kicker">{TOPIC_LABEL[topic]}</span>'
        f'<span class="pick-title">{title}</span>'
        f'<span class="pick-text">{pitch}</span>'
        f'<span class="pick-ref">{ref} <span aria-hidden="true">→</span></span></a>'
        for topic, title, ref, arx, pitch in SELECTED)


def talk_row(year, event, city, title, note):
    note_html = f'<div class="meta">{note}</div>' if note else ""
    return (f'<div class="entry"><div class="rail">{year}</div><div class="body">'
            f'<span class="where">{city}</span>'
            f'<span class="title">“{title}”</span>'
            f'<div class="detail">{event}</div>{note_html}</div></div>')


def render_talks():
    cards = []
    for year, event, city, title, note, invited in TALKS[:TALK_CARDS]:
        note_html = f'<div class="tc-note">{note}</div>' if note else ""
        cards.append(
            f'<article class="talk-card"><div class="tc-top"><span>{year}</span><span>{city}</span></div>'
            f'<h4 class="tc-title">“{title}”</h4><div class="tc-event">{event}</div>{note_html}</article>')
    rest = [talk_row(y, ev, c, ti, no) for y, ev, c, ti, no, _ in TALKS[TALK_CARDS:]]
    out = '<div class="talk-cards">' + "\n".join(cards) + '</div>'
    if rest:
        out += (f'\n<details class="more"><summary>Show {len(rest)} earlier talks</summary>\n'
                + "\n".join(rest) + "\n</details>")
    return out


def fund_card(year, name, agency, country, amount, dur, status):
    main, _, approx = amount.partition(" (")
    approx = approx.rstrip(")")
    tags = '<span class="tag">awarded</span>' + (f' <span class="tag grey">{status.lower()}</span>' if status else "")
    return (f'<article class="fund"><div class="fund-top"><span>{year}</span><span>{country}</span></div>'
            f'<h4 class="fund-name">{name}</h4><div class="fund-agency">{agency}</div>'
            f'<div class="fund-amount">{main}</div>'
            f'<div class="fund-meta">{approx} <span class="sep">·</span> {dur}</div>'
            f'<div class="fund-tags">{tags}</div></article>')


def render_funding():
    senior = [f for f in FUNDING if int(f[0]) >= 2024]
    junior = [f for f in FUNDING if int(f[0]) < 2024]
    return ('<h3 class="sect">Postdoctoral fellowships and grants</h3>'
            '<div class="funds two">' + "".join(fund_card(*f) for f in senior) + '</div>'
            '<h3 class="sect">Doctoral and master\'s fellowships</h3>'
            '<div class="funds three">' + "".join(fund_card(*f) for f in junior) + '</div>')


def render_teaching():
    return '<div class="courses">' + "".join(
        f'<article class="course"><div class="kicker">{y} <span class="sep">·</span> {inst}</div>'
        f'<h4 class="course-title">{course}</h4><div class="course-role">{role}</div>'
        f'<p>{desc}</p></article>'
        for y, course, role, inst, desc in TEACHING) + '</div>'


def render_supervision():
    return '<div class="students">' + "".join(
        f'<article class="student"><div class="kicker">{y} <span class="sep">·</span> {lvl}</div>'
        f'<h4 class="student-name">{name}</h4><div class="student-inst">{inst}</div>'
        f'<p class="student-thesis"><span>Thesis</span><i>{thesis}</i></p></article>'
        for y, name, lvl, inst, thesis in SUPERVISION) + '</div>'


def render_positions(items):
    out = []
    for p in items:
        logos = "".join(f'<img src="assets/logos/{f}.png?v={_ver(f"assets/logos/{f}.png")}" alt="{alt}" loading="lazy">'
                        for f, alt in p["logos"])
        note = f'<p class="blk-note">{p["note"]}</p>' if p.get("note") else ""
        meta = f'<p class="blk-meta">{p["meta"]}</p>' if p.get("meta") else ""
        if p.get("facts"):
            meta += '<dl class="blk-facts">' + "".join(
                f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in p["facts"]) + '</dl>'
        out.append(
            f'<article class="blk"><div class="blk-logos">{logos}</div>'
            f'<div class="blk-body"><div class="blk-when">{p["when"]}</div>'
            f'<h4 class="blk-title">{p["title"]}</h4><div class="blk-org">{p["org"]}</div>'
            f'{note}{meta}<div class="blk-where">{p["where"]}</div></div></article>')
    return "\n".join(out)


def render_toolkit():
    return "\n".join(
        f'<div class="tool"><div class="kicker">{group}</div>'
        f'<ul>{"".join(f"<li>{x}</li>" for x in items)}</ul></div>'
        for group, items in TOOLKIT)


def render_tongues():
    return "\n".join(
        f'<div class="tongue"><span class="t-name">{name}</span><span class="t-level">{level}</span></div>'
        for name, level in LANGUAGES)


def render_software():
    return "\n".join(
        f'<div class="card"><h4>{name}</h4><p>{desc}</p>'
        f'<div class="links"><a href="{url}">GitHub</a> '
        f'<a href="https://arxiv.org/abs/{arx}">arXiv:{arx}</a></div></div>'
        for name, desc, url, arx in SOFTWARE)


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
        "knowsAbout": ["Feynman integrals", "Mellin-Barnes integrals", "hypergeometric functions",
                       "Higgs physics", "beyond the Standard Model", "collider phenomenology",
                       "effective field theory"],
        "sameAs": [f"https://orcid.org/{P['orcid']}", P["inspire"], P["github"], P["linkedin"]],
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
    ("talks.html",        "Talks",        "Talks",                 "Invited seminars and conference talks since 2020.",             ["talks"]),
    ("funding.html",      "Funding",      "Research Funding",      "Fellowships and grants awarded for my research.",               ["funding"]),
    ("teaching.html",     "Teaching",     "Teaching and Mentoring", "Courses I have taught and students I have supervised.",        ["teaching"]),
    ("cv.html",           "CV",           "Curriculum Vitae",      "Positions, education, skills and service to the community.",   ["cv", "refereeing"]),
    ("contact.html",      "Contact",      "Contact",               "Feel free to get in touch. I am always happy to hear from you.", ["reach"]),
]

# Opening reveal: a brass monogram on Oxford green (shown once per visit, see <head>).
INTRO = ('<div class="intro" aria-hidden="true"><svg viewBox="0 0 100 100">'
         '<circle cx="50" cy="50" r="46" pathLength="1"/><text x="50" y="61" text-anchor="middle">SB</text></svg></div>\n')

# Where each old in-page anchor now lives.
LINK_MAP = {"#about": "index.html#about", "#reach": "contact.html", "#research": "research.html", "#publications": "publications.html",
            "#software": "research.html#software", "#talks": "talks.html", "#funding": "funding.html",
            "#teaching": "teaching.html", "#refereeing": "cv.html#refereeing", "#cv": "cv.html"}


def render_explore(n_articles, n_proc):
    cards = [
        ("research.html", "Research", "Feynman integrals, EFTs and Higgs physics", f"3 research themes · {len(SOFTWARE)} software packages"),
        ("publications.html", "Publications", "Articles, proceedings and thesis", f"{n_articles} journal articles · {n_proc} proceedings"),
        ("talks.html", "Talks", "Seminars and conference talks", f"{len(TALKS)} talks since {min(t[0] for t in TALKS)}"),
        ("funding.html", "Funding", "Fellowships and grants", f"{len(FUNDING)} fellowships and grants"),
        ("teaching.html", "Teaching", "Courses and supervision", f"{len(TEACHING)} courses · {len(SUPERVISION)} students"),
        ("cv.html", "CV", "Curriculum vitae", "Positions, education and skills"),
    ]
    items = "\n".join(
        f'<a class="ex-card" href="{href}"><span class="ex-num" aria-hidden="true">{n:02d}</span>'
        f'<span class="kicker">{kick}</span><span class="ex-title">{title}</span>'
        f'<span class="ex-meta">{meta}</span><span class="ex-go" aria-hidden="true">→</span></a>'
        for n, (href, kick, title, meta) in enumerate(cards, 1))
    return ('<section class="chapter" id="explore">\n<h2 class="chapter-title">Explore</h2>\n'
            f'<div class="explore">\n{items}\n</div>\n</section>')


def render_reach():
    P = PROFILE
    profiles = [("ORCID", f"https://orcid.org/{P['orcid']}", "i_orcid"), ("INSPIRE", P["inspire"], "i_inspire"),
                ("Google Scholar", P["scholar"], "i_scholar"), ("arXiv", P["arxiv"], "i_arxiv"),
                ("GitHub", P["github"], "i_github"), ("LinkedIn", P["linkedin"], "i_linkedin")]
    links = "".join(f'<li><a href="{url}">{ICONS[icon]}{name}</a></li>' for name, url, icon in profiles)
    return f'''<section class="chapter" id="reach">
<div class="reach">
  <article class="reach-card">
    <div class="kicker">Email</div>
    <a class="reach-big" href="mailto:{P["email"]}">{P["email"]}</a>
    <p>Email is the best way to reach me.</p>
    <p><a class="button" href="mailto:{P["email"]}">Send an email</a></p>
  </article>
  <article class="reach-card">
    <div class="kicker">Address</div>
    <p class="reach-addr">Fundamental Physics Directorate<br>SLAC National Accelerator Laboratory<br>2575 Sand Hill Road<br>Menlo Park, CA 94025<br>United States</p>
  </article>
  <article class="reach-card">
    <div class="kicker">Profiles</div>
    <ul class="reach-links">{links}</ul>
  </article>
</div>
</section>'''


def write_pages(html, n_articles, n_proc):
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

    def navbar(current):
        here = ' class="here" aria-current="page"'
        links = "".join(f'<a href="{f}"{here if f == current else ""}>{label}</a>'
                        for f, label, *_ in PAGES if label)
        return (f'<div class="navbar">\n  <div class="wrap nav-inner">\n'
                f'    <a class="brand" href="index.html">{P["name"]}</a>\n'
                f'    <nav aria-label="Pages">{links}</nav>\n  </div>\n</div>\n')

    def letters(text):
        out, i = [], 0
        for word in text.split():
            out.append('<span class="w" aria-hidden="true">' + "".join(
                f'<span class="ch" style="--i:{i + k}">{c}</span>' for k, c in enumerate(word)) + '</span>')
            i += len(word) + 1
        return " ".join(out)

    def page_hero(label, title, sub):
        return (f'<header class="masthead hero page-hero">\n  <canvas class="field" aria-hidden="true"></canvas>\n'
                f'  <div class="wrap hero-inner">\n   <div class="hero-text">\n'
                f'    <p class="crumb"><a href="index.html">{P["name"]}</a><span aria-hidden="true">/</span>{label}</p>\n'
                f'    <h1 class="page-title" aria-label="{title}">{letters(title)}</h1>\n    <p class="page-sub">{sub}</p>\n   </div>\n'
                f'   <div class="hero-stage" aria-hidden="true" title="Click for a new collision"></div>\n  </div>\n</header>\n')

    def relink(body, current):
        for anchor, target in LINK_MAP.items():
            file, _, frag = target.partition("#")
            local = ("#" + frag) if frag else "#top"
            body = body.replace(f'href="{anchor}"', f'href="{local if file == current else target}"')
        return body

    written = []
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
                + (hero if file == "index.html" else page_hero(label, title, sub))
                + navbar(file)
                + (ticker if file == "index.html" else "")
                + '<main id="main" class="wrap">\n\n' + "\n\n".join(parts) + "\n\n" + tail)
        Path(file).write_text(relink(h + body, file), encoding="utf-8")
        written.append(file)

    # a friendly 404 page for mistyped addresses
    nf = (head.replace("<title>Sumit Banik | Theoretical Particle Physics</title>", "<title>Page not found | Sumit Banik</title>")
          + '<body id="top" class="page-404">\n' + INTRO + page_hero("Not found", "Page not found",
            "The page you are looking for does not exist. It may have moved.")
          + navbar("") + '<main id="main" class="wrap">\n<section class="chapter"><p class="about-links">'
          '<a href="index.html">Go to the home page <span aria-hidden="true">→</span></a></p></section>\n\n'
          + sections["contact"] + "\n\n" + tail)
    Path("404.html").write_text(relink(nf, "404.html"), encoding="utf-8")

    # sitemap for search engines
    urls = "".join(f"<url><loc>{P['url'] + ('' if f == 'index.html' else f)}</loc></url>" for f, *_ in PAGES)
    Path("sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
                                   f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    Path("robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {P['url']}sitemap.xml\n")
    print(f"wrote {', '.join(written)}, 404.html, sitemap.xml  ({len(PUBS)} publications, {len(TALKS)} talks)")


def _ver(path):
    """Short version tag from the file's modification time, so browsers never show a stale copy."""
    return format(int(Path(path).stat().st_mtime), "x")


def main():
    P = PROFILE
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

    html = TEMPLATE.format(
        desc=desc, url=P["url"], jsonld=jsonld(), portrait=portrait,
        email=P["email"], orcid=P["orcid"], inspire=P["inspire"], scholar=P["scholar"],
        arxiv=P["arxiv"], github=P["github"], linkedin=P["linkedin"],
        n_articles=n_articles, n_proc=n_proc, n_talks=len(TALKS), n_invited=n_invited,
        pubs=render_pubs(), talks=render_talks(), news=render_news(), selected=render_selected(), journey=render_journey(), journey_map=render_journey_map(), ticker=render_ticker(), funding=render_funding(),
        teaching=render_teaching(), supervision=render_supervision(),
        software=render_software(), toolkit=render_toolkit(), employment=render_positions(EMPLOYMENT), education=render_positions(EDUCATION), tongues=render_tongues(),
        referee="\n".join(f'<a class="journal" href="{url}"><span class="j-name">{name}</span><span class="j-pub">{pub}</span><span class="j-go" aria-hidden="true">→</span></a>' for name, pub, url in REFEREE),
        n_total=len(PUBS), name_letters=name_letters, hero_portrait=hero_portrait, v_css=_ver("assets/style.css"), **ICONS,
        updated=date.today().strftime("%B %Y"), year=date.today().year,
    )
    write_pages(html, n_articles, n_proc)


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
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap">
<link rel="stylesheet" href="assets/style.css?v={v_css}">
<script type="application/ld+json">{jsonld}</script>
<script>document.documentElement.classList.add("js");try{{if(!sessionStorage.getItem("sb-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){{document.documentElement.classList.add("intro-on");sessionStorage.setItem("sb-intro","1")}}}}catch(e){{}}</script>
</head>
<body id="top">
<a class="skip" href="#main">Skip to content</a>

<header class="masthead hero">
  <canvas class="field" aria-hidden="true"></canvas>
  <div class="wrap hero-inner">
   <div class="hero-text">
    <h1><a class="name" href="#about" aria-label="Sumit Banik">{name_letters}</a></h1>
    <div class="who">
      <span class="role">Postdoctoral Researcher, <a href="https://fundamentalphysics.slac.stanford.edu/">Fundamental Physics Directorate</a></span>
      <span class="org"><a href="https://theory.slac.stanford.edu/">SLAC National Accelerator Laboratory</a>
        <span class="sep">·</span> <a href="https://www.stanford.edu/">Stanford University</a></span>
    </div>
    <p class="tagline">From the mathematics of Feynman integrals <br class="hero-br">to new physics beyond the Standard&nbsp;Model.</p>
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
   <div class="hero-stage" aria-hidden="true" title="Click for a new collision"></div>
  </div>
  <a class="scroll-cue" href="#about" aria-label="Scroll to the About section"><span></span></a>
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
<p class="statement" data-hold="2600">My research spans a broad range of topics in theoretical particle
physics, from the mathematics of special functions and the analytic
and numerical computation of Feynman integrals, to
effective field theories, renormalization group evolution,
Higgs physics and the search for new phenomena at the Large Hadron
Collider at CERN.</p>
<p class="about-links"><a href="assets/cv/Sumit_Banik_CV.pdf">Read the full CV <span aria-hidden="true">→</span></a>
<a href="contact.html">Get in touch <span aria-hidden="true">→</span></a></p>
</div>
</div>

<h3 class="sect">Academic journey</h3>
{journey_map}
<ol class="journey legend" data-hold="2900">
{journey}
</ol>

<div class="stats" role="list">
  <div class="stat" role="listitem"><span class="n">{n_articles}</span><span class="l">journal articles</span></div>
  <div class="stat" role="listitem"><span class="n">{n_proc}</span><span class="l">conference proceedings</span></div>
  <div class="stat" role="listitem"><span class="n">{n_talks}</span><span class="l">talks &amp; seminars</span></div>
  <div class="stat" role="listitem"><span class="n">3</span><span class="l">software packages</span></div>
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
<div class="themes">
  <div class="theme">
    <h4>Feynman integrals &amp; special functions</h4>
    <p>Analytic evaluation of multi-loop and multi-scale Feynman integrals through
    <i>N</i>-fold Mellin-Barnes representations, their geometry (conic hulls,
    triangulations), GKZ hypergeometric systems and the method of brackets.</p>
    <div class="keys">Mellin-Barnes · hypergeometric functions · conformal integrals</div>
  </div>
  <div class="theme pheno">
    <h4>Higgs physics &amp; BSM phenomenology</h4>
    <p>Extended scalar sectors (2HDM, N2HDM, Higgs triplets) confronted with LHC
    data, including the di-photon excesses near 95 and 152 GeV, differential
    top-quark distributions and correlations with EDMs.</p>
    <div class="keys">collider phenomenology · new scalars · LHC anomalies</div>
  </div>
  <div class="theme soft">
    <h4>EFTs &amp; computational tools</h4>
    <p>Renormalization-group evolution in SMEFT and leptoquark models, two-loop
    anomalous dimensions, and open-source Mathematica packages for precision
    calculations.</p>
    <div class="keys">SMEFT · RG evolution · computer algebra</div>
  </div>
</div>
<h3 class="sect">Selected work</h3>
<div class="picks">
{selected}
</div>
</section>

<section class="chapter" id="publications">
<h2 class="chapter-title">Publications</h2>
<p class="muted" style="margin-bottom:0">Complete and up-to-date records:
<a href="{inspire}">INSPIRE-HEP</a> · <a href="{arxiv}">arXiv</a> · <a href="https://orcid.org/{orcid}">ORCID</a>.</p>
<div class="filters" role="group" aria-label="Filter publications by topic">
  <button type="button" data-filter="all" aria-pressed="true">All ({n_total})</button>
  <button type="button" data-filter="fi" aria-pressed="false">Feynman integrals</button>
  <button type="button" data-filter="pheno" aria-pressed="false">Phenomenology</button>
  <button type="button" data-filter="soft" aria-pressed="false">Software</button>
  <input class="pub-search" type="search" placeholder="Search publications" aria-label="Search publications">
</div>
<p class="pub-empty" hidden>No publications match your search.</p>
{pubs}
<button class="pub-more" type="button">Show all {n_total} publications</button>
</section>

<section class="chapter" id="software">
<h2 class="chapter-title">Software</h2>
<p class="prose">Open-source <i>Mathematica</i> packages I have developed with my collaborators.</p>
<div class="cards">
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
<h2 class="chapter-title">Teaching &amp; Mentoring</h2>
<h3 class="sect">Teaching</h3>
{teaching}
<h3 class="sect">Supervision</h3>
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

<h3 class="sect">Research interests</h3>
<div class="interests">
  <div class="interest pheno">
    <div class="kicker">Particle phenomenology</div>
    <ul>
      <li>Collider phenomenology</li>
      <li>Beyond the Standard Model</li>
      <li>Higgs physics</li>
      <li>Effective field theory</li>
    </ul>
  </div>
  <div class="interest fi">
    <div class="kicker">Mathematical &amp; computational methods</div>
    <ul>
      <li>Multi-loop Feynman integrals</li>
      <li>Hypergeometric functions</li>
      <li>Mellin-Barnes representation</li>
      <li>Computer algebra</li>
    </ul>
  </div>
</div>

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
    <div class="foot-aff">Fundamental Physics Directorate<br>SLAC National Accelerator Laboratory · Stanford&nbsp;University</div>
    <a class="foot-mail" href="mailto:{email}">{email}</a>
  </div>
  <div class="foot-meta">
    <a href="#top">Back to top ↑</a>
    <span>© {year} Sumit Banik · Last updated {updated}</span>
  </div>
</div>
</footer>

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
  var buttons = document.querySelectorAll('.filters button');
  var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));
  var heads = document.querySelectorAll('#publications .sect');
  var search = document.querySelector('.pub-search');
  var more = document.querySelector('.pub-more');
  var empty = document.querySelector('.pub-empty');
  var LIMIT = 8, topic = 'all', query = '', open = false;
  function applyPubs() {{
    var shown = 0, matches = 0, narrowed = topic !== 'all' || query !== '';
    pubs.forEach(function (p) {{
      var ok = (topic === 'all' || p.dataset.topic.split(' ').indexOf(topic) >= 0) &&
               (!query || p.textContent.toLowerCase().indexOf(query) >= 0);
      if (ok) matches++;
      var vis = ok && (open || narrowed || shown < LIMIT);
      if (vis) shown++;
      p.hidden = !vis;
      if (vis) reveal(p);
    }});
    heads.forEach(function (h) {{
      var el = h.nextElementSibling, any = false;
      while (el && el.classList.contains('pub')) {{ if (!el.hidden) any = true; el = el.nextElementSibling; }}
      h.hidden = !any;
    }});
    if (more) more.hidden = open || narrowed || matches <= LIMIT;
    if (empty) empty.hidden = matches > 0;
  }}
  buttons.forEach(function (b) {{
    b.addEventListener('click', function () {{
      topic = b.dataset.filter;
      buttons.forEach(function (x) {{ x.setAttribute('aria-pressed', x === b); }});
      applyPubs();
    }});
  }});
  if (search) search.addEventListener('input', function () {{ query = search.value.trim().toLowerCase(); applyPubs(); }});
  if (more) more.addEventListener('click', function () {{ open = true; applyPubs(); }});
  applyPubs();

  /* ---------- scroll reveal (staggered within each group) ---------- */
  var sel = ['.chapter-title', '.epigraph', '.prose > p', '.portrait-frame', '.statement', '.about-links', '.journey', '.news li', '.stat',
             '.theme', '.pick', '.card', '.pub', '.talk-card', '.fund', '.course', '.student',
             '.journal', '.blk', '.interest', '.tool', '.tongues', '.contact-card', '.filters', '.sect', '.ex-card'];
  var items = document.querySelectorAll(sel.join(','));
  if (!reduce && 'IntersectionObserver' in window) {{
    var seen = new WeakMap();
    Array.prototype.forEach.call(items, function (el) {{
      var parent = el.parentElement, n = seen.get(parent) || 0;
      seen.set(parent, n + 1);
      el.style.setProperty('--d', (n % 6) * 70 + 'ms');
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

  /* ---------- opening reveal: lift the curtain, then let the page animations run ---------- */
  if (document.documentElement.classList.contains('intro-on')) {{
    setTimeout(function () {{ document.documentElement.classList.remove('intro-on'); }}, 2450);
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
      heroField = heroEl && heroEl.querySelector('.field');
  function parallax() {{
    if (reduce || !heroEl) return;
    var y = window.scrollY, h = heroEl.offsetHeight;
    if (y > h) return;
    if (heroText) {{ heroText.style.transform = 'translateY(' + (y * 0.2).toFixed(1) + 'px)'; heroText.style.opacity = (1 - 0.85 * y / h).toFixed(3); }}
    if (heroField) heroField.style.transform = 'translateY(' + (y * 0.38).toFixed(1) + 'px)';
  }}
  window.addEventListener('scroll', parallax, {{ passive: true }});

  /* ---------- progress bar, back-to-top, current page in the menu ---------- */
  var nav = document.querySelector('.navbar nav'), here = nav && nav.querySelector('.here');
  if (nav && here && getComputedStyle(nav).overflowX === 'auto' && nav.scrollWidth > nav.clientWidth + 2) {{
    nav.scrollLeft = Math.max(0, here.offsetLeft - 24);
  }}
  var bar = document.querySelector('.progress'), top = document.querySelector('.to-top');
  function update() {{
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    if (top) top.classList.toggle('show', window.scrollY > window.innerHeight * 0.9);
  }}
  window.addEventListener('scroll', update, {{ passive: true }});
  window.addEventListener('resize', update);
  update();

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
     A detector cross-section on the right of the hero: beam pipe, tracker
     layers, calorimeter and muon chambers. Every few seconds a collision at
     the centre sends charged tracks spiralling outward in the solenoid field
     (low-momentum ones curl up inside the tracker), with two back-to-back
     jets, a muon pair reaching the outer chambers, dashed photons, and
     energy deposits in the calorimeter. Click the stage for a new event. */
  var hero = document.querySelector('.hero'), cv = hero && hero.querySelector('.field');
  var stage = hero && hero.querySelector('.hero-stage');
  if (cv && cv.getContext) {{
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, CX = 0, CY = 0, RO = 200, tracks = [], flashAt = -1e9, nextAt = 0, visible = true, raf = null;
    var t0 = performance.now(), TAU = Math.PI * 2;
    function size() {{
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stage && stage.offsetWidth) {{
        var p = stage.getBoundingClientRect();
        CX = p.left - r.left + p.width / 2; CY = p.top - r.top + p.height / 2;
        RO = Math.min(p.width * 0.6, H * 0.44);
      }} else {{ CX = W * 0.72; CY = H / 2; RO = Math.min(W, H) * 0.38; }}
    }}
    function rnd(a, b) {{ return a + Math.random() * (b - a); }}
    function spawn(now) {{
      var jet = rnd(0, TAU), list = [];
      for (var i = 0; i < 26; i++) {{
        var inJet = i < 16, side = i % 2 ? Math.PI : 0;
        list.push({{ phi: inJet ? jet + side + rnd(-0.3, 0.3) : rnd(0, TAU), q: Math.random() < 0.5 ? -1 : 1,
                    rc: RO * (inJet ? rnd(0.7, 7) : rnd(0.12, 2.2)), kind: 'track' }});
      }}
      var mu = rnd(0, TAU);
      list.push({{ phi: mu, q: 1, rc: RO * 9, kind: 'muon' }});
      list.push({{ phi: mu + Math.PI + rnd(-0.35, 0.35), q: -1, rc: RO * 9, kind: 'muon' }});
      for (var g = 0; g < 2; g++) list.push({{ phi: rnd(0, TAU), q: 0, rc: 0, kind: 'photon' }});
      list.forEach(function (tr) {{ tr.born = now + rnd(40, 160); tr.e = rnd(0.25, 1); }});
      tracks = tracks.concat(list);
      flashAt = now;
    }}
    function point(tr, s) {{
      if (!tr.q) return [Math.cos(tr.phi) * s, Math.sin(tr.phi) * s];
      var cx = -Math.sin(tr.phi) * tr.q * tr.rc, cy = Math.cos(tr.phi) * tr.q * tr.rc;
      var a = tr.q * s / tr.rc, c = Math.cos(a), sn = Math.sin(a);
      return [cx - cx * c + cy * sn, cy - cx * sn - cy * c];
    }}
    function ring(r, alpha, width) {{
      ctx.lineWidth = width; ctx.strokeStyle = 'rgba(168,137,79,'+alpha+')';
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, TAU); ctx.stroke();
    }}
    function frame(now) {{
      ctx.clearRect(0, 0, W, H);
      var t = (now - t0) / 1000;
      // detector: beam pipe, tracker layers, calorimeter band, muon chambers
      ring(RO * 0.05, 0.45, 1);
      [0.13, 0.19, 0.25, 0.31, 0.37].forEach(function (k) {{ ring(RO * k, 0.16, 0.7); }});
      ctx.fillStyle = 'rgba(168,137,79,0.06)';
      ctx.beginPath(); ctx.arc(CX, CY, RO * 0.72, 0, TAU); ctx.arc(CX, CY, RO * 0.5, 0, TAU, true); ctx.fill();
      ring(RO * 0.5, 0.3, 0.9); ring(RO * 0.72, 0.3, 0.9);
      [0.84, 0.92].forEach(function (k) {{ ring(RO * k, 0.2, 0.8); }});
      var spin = reduce ? 0 : t * 0.03;
      ctx.strokeStyle = 'rgba(46,92,78,0.26)'; ctx.lineWidth = 0.8;
      for (var i = 0; i < 160; i++) {{
        var a = spin + i * TAU / 160, len = i % 20 === 0 ? 12 : (i % 4 === 0 ? 6 : 3);
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a) * RO, CY + Math.sin(a) * RO);
        ctx.lineTo(CX + Math.cos(a) * (RO + len), CY + Math.sin(a) * (RO + len));
        ctx.stroke();
      }}
      if (!reduce && now > nextAt) {{ spawn(now); nextAt = now + 3800; }}
      // interaction flash
      var fl = (now - flashAt) / 700;
      if (fl >= 0 && fl < 1) {{
        var g = ctx.createRadialGradient(CX, CY, 0, CX, CY, RO * 0.16);
        g.addColorStop(0, 'rgba(220,197,143,'+(0.9*(1-fl)) + ')'); g.addColorStop(1, 'rgba(220,197,143,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, RO * 0.16, 0, TAU); ctx.fill();
      }}
      ctx.fillStyle = 'rgba(46,92,78,0.7)'; ctx.beginPath(); ctx.arc(CX, CY, 2.2, 0, TAU); ctx.fill();
      var r0 = RO * 0.05, rCal = RO * 0.5, rMu = RO * 0.97;
      tracks = tracks.filter(function (tr) {{ return now - tr.born < 4800; }});
      tracks.forEach(function (tr) {{
        var age = (now - tr.born) / 1000;
        if (age < 0) return;
        var fade = age < 1.5 ? 1 : Math.max(0, 1 - (age - 1.5) / 3.1);
        var reach = tr.kind === 'muon' ? rMu : rCal;
        var sMax = tr.q ? Math.min(Math.PI * tr.rc, reach * 1.7) : reach;
        var s = reduce ? sMax : Math.min(sMax, age * 700);
        ctx.lineWidth = tr.kind === 'muon' ? 1.7 : (tr.kind === 'photon' ? 1 : 0.9);
        ctx.strokeStyle = tr.kind === 'muon' ? 'rgba(46,92,78,'+(0.85*fade) + ')'
                        : tr.kind === 'photon' ? 'rgba(168,137,79,'+(0.6*fade) + ')'
                        : 'rgba(168,137,79,'+(0.7*fade) + ')';
        ctx.setLineDash(tr.kind === 'photon' ? [4, 4] : []);
        ctx.beginPath();
        var drawing = false, last = -1, hit = false, d;
        for (d = 0; d <= s; d += 4) {{
          var p = point(tr, d), rr = Math.hypot(p[0], p[1]);
          if (rr > reach) {{ hit = true; break; }}
          if (rr < last - 0.5) break;                   // curled back: the track stops inside the tracker
          last = rr;
          if (rr < r0) continue;
          if (!drawing) {{ ctx.moveTo(CX + p[0], CY + p[1]); drawing = true; }} else ctx.lineTo(CX + p[0], CY + p[1]);
        }}
        ctx.stroke(); ctx.setLineDash([]);
        if (hit && tr.kind !== 'muon') {{               // calorimeter deposit
          var pe = point(tr, Math.max(0, d - 4)), ang = Math.atan2(pe[1], pe[0]), h = RO * (0.04 + tr.e * 0.18);
          ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(46,92,78,'+(0.5*fade) + ')';
          ctx.beginPath();
          ctx.moveTo(CX + Math.cos(ang) * rCal, CY + Math.sin(ang) * rCal);
          ctx.lineTo(CX + Math.cos(ang) * (rCal + h), CY + Math.sin(ang) * (rCal + h));
          ctx.stroke();
        }}
      }});
      raf = (!reduce && visible && !document.hidden) ? requestAnimationFrame(frame) : null;
    }}
    function start() {{ if (!raf && !reduce) raf = requestAnimationFrame(frame); }}
    size();
    if (reduce) {{ spawn(performance.now() - 1600); frame(performance.now()); }} else start();
    window.addEventListener('resize', function () {{ size(); if (reduce) frame(performance.now()); }});
    if (stage) stage.addEventListener('click', function () {{
      if (!reduce) {{ spawn(performance.now()); nextAt = performance.now() + 3800; }}
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
